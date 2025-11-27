import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { db } from "./db";
import { timePunches, machines, parts } from "@shared/schema";
import { eq, and, desc, sql, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { insertUserSchema, updateUserSchema, insertWorkOrderSchema, type InsertWorkOrder, insertAppointmentSchema, updateAppointmentSchema, insertMessageSchema, insertCustomerSchema, insertConversationSchema } from "@shared/schema";
import { z } from "zod";
import { seedAdminUser } from "./seed";
import { seedWorkOrders } from "./seedWorkOrders";
import { upload } from "./upload";
import express from "express";
import multer from "multer";
import { sendWorkOrderDemandEmail, sendWorkOrderAssignmentEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  await seedAdminUser();
  
  // Only seed work orders if explicitly enabled via environment variable
  if (process.env.SEED_WORK_ORDERS === "true") {
    await seedWorkOrders();
  }
  
  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));
  
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };
  
  // Upload photo endpoint with auth before multer
  app.post("/api/upload/photo", requireAuth, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const filePath = `/uploads/${req.file.path.split('uploads/')[1]}`;
      res.json({ filePath });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });
  
  // Multer error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "File size too large (max 10MB)" });
      }
      return res.status(400).json({ message: `Upload error: ${error.message}` });
    }
    if (error.message && error.message.includes('Only image files')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({
        id: user.id,
        username: user.username,
        employeeId: user.employeeId,
        role: user.role,
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Allow users to update their own profile (bannerImage, etc)
  app.patch("/api/users/me/profile", requireAuth, async (req, res) => {
    try {
      const { bannerImage, profilePicture } = req.body;
      const updates: any = {};
      
      if (bannerImage !== undefined) {
        updates.bannerImage = bannerImage || null;
      }
      if (profilePicture !== undefined) {
        updates.profilePicture = profilePicture || null;
      }

      const user = await storage.updateUser(req.session.userId!, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        bannerImage: user.bannerImage,
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.json({
      id: user.id,
      username: user.username,
      employeeId: user.employeeId,
      role: user.role,
      email: user.email,
      department: user.department,
      headquarters: user.headquarters,
      profilePicture: user.profilePicture,
      bannerImage: user.bannerImage,
      mood: user.mood || "neutral",
    });
  });

  app.patch("/api/auth/user/mood", requireAuth, async (req, res) => {
    try {
      const { mood } = req.body;
      
      const moodSchema = z.object({
        mood: z.enum(["happy", "focused", "tired", "stressed", "neutral"]),
      });
      
      const { mood: validMood } = moodSchema.parse({ mood });

      const user = await storage.updateUser(req.session.userId!, { mood: validMood } as any);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        mood: user.mood,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update mood" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        username: user.username,
        employeeId: user.employeeId,
        role: user.role,
        email: user.email,
        department: user.department,
        headquarters: user.headquarters,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmployeeId = await storage.getUserByEmployeeId(validatedData.employeeId);
      if (existingEmployeeId) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }

      const newUser = await storage.createUser(validatedData);
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      const isAdmin = currentUser?.role === "admin";

      const users = await storage.getAllUsers();

      // Admin gets full user data, non-admins get minimal data for UI/assignments
      if (isAdmin) {
        res.json(users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          email: u.email,
          department: u.department,
          isActive: u.isActive,
        })));
      } else {
        // Non-admins only get data needed for work order assignments
        res.json(users.map(u => ({
          id: u.id,
          username: u.username,
          role: u.role,
          isActive: u.isActive,
        })));
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user statistics (efficiency, hours worked) - MUST come before /api/users/:id
  app.get("/api/users/stats", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUserById(req.session.userId);
      // User may not exist in database yet, but we can still calculate stats from punches

      // Get all work orders assigned to this user
      const assignedWorkOrders = user ? await storage.getAssignedWorkOrders(req.session.userId) : [];
      
      // Filter completed work orders with efficiency
      const completedWorkOrders = assignedWorkOrders.filter(
        wo => (wo.status === "completed" || wo.status === "closedForReview") && wo.efficiency !== null
      );

      // Calculate average efficiency
      const avgEfficiency = completedWorkOrders.length > 0
        ? completedWorkOrders.reduce((sum, wo) => sum + (wo.efficiency || 0), 0) / completedWorkOrders.length
        : null;

      // Get all time punches for the user
      const allPunches = await db
        .select()
        .from(timePunches)
        .where(eq(timePunches.userId, req.session.userId));

      // Calculate total WORK hours by day (excluding lunch)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const workHoursToday = allPunches
        .filter(p => {
          const punchDate = new Date(p.punchDate);
          return punchDate >= today && p.punchType === "work";
        })
        .reduce((sum, punch) => {
          if (punch.clockOut) {
            const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

      // Calculate break hours today (tracked as "other" punch type with breakMinutes field)
      const breakHoursToday = allPunches
        .filter(p => {
          const punchDate = new Date(p.punchDate);
          return punchDate >= today && p.punchType === "other";
        })
        .reduce((sum, punch) => {
          if (punch.clockOut) {
            const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

      const hoursToday = Math.max(0, workHoursToday - breakHoursToday);

      // Calculate WORK hours this week (excluding lunch)
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const workHoursThisWeek = allPunches
        .filter(p => {
          const punchDate = new Date(p.punchDate);
          return punchDate >= startOfWeek && p.punchType === "work";
        })
        .reduce((sum, punch) => {
          if (punch.clockOut) {
            const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

      // Calculate break hours this week
      const breakHoursThisWeek = allPunches
        .filter(p => {
          const punchDate = new Date(p.punchDate);
          return punchDate >= startOfWeek && p.punchType === "other";
        })
        .reduce((sum, punch) => {
          if (punch.clockOut) {
            const hours = (new Date(punch.clockOut).getTime() - new Date(punch.clockIn).getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);

      const hoursThisWeek = Math.max(0, workHoursThisWeek - breakHoursThisWeek);

      // For technical advisors, get ALL completed work orders efficiency
      let allCompletedEfficiency = null;
      if (user && (user.role === "technical_advisor" || user.role === "admin")) {
        const { workOrders: workOrdersTable } = await import("@shared/schema");
        const allWorkOrders = await db.select().from(workOrdersTable);
        const allCompleted = allWorkOrders.filter(
          wo => (wo.status === "completed" || wo.status === "closedForReview") && wo.efficiency !== null
        );
        allCompletedEfficiency = allCompleted.length > 0
          ? allCompleted.reduce((sum, wo) => sum + (wo.efficiency || 0), 0) / allCompleted.length
          : null;
      }

      // Calculate kilometers from travel punches
      const kmToday = allPunches
        .filter(p => {
          const punchDate = new Date(p.punchDate);
          return punchDate >= today && p.punchType === "travel" && p.kilometers;
        })
        .reduce((sum, punch) => sum + (punch.kilometers || 0), 0);

      const kmThisWeek = allPunches
        .filter(p => {
          const punchDate = new Date(p.punchDate);
          return punchDate >= startOfWeek && p.punchType === "travel" && p.kilometers;
        })
        .reduce((sum, punch) => sum + (punch.kilometers || 0), 0);
      
      const kmOverall = allPunches
        .filter(p => p.punchType === "travel" && p.kilometers)
        .reduce((sum, punch) => sum + (punch.kilometers || 0), 0);

      const response = {
        assignedWorkOrdersCount: assignedWorkOrders.length,
        completedWorkOrdersCount: completedWorkOrders.length,
        avgEfficiency,
        hoursToday: Math.round(hoursToday * 10) / 10,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        kmToday: Math.round(kmToday * 10) / 10,
        kmThisWeek: Math.round(kmThisWeek * 10) / 10,
        kmOverall: Math.round(kmOverall * 10) / 10,
        allCompletedEfficiency: allCompletedEfficiency !== null ? Math.round(allCompletedEfficiency * 10) / 10 : null,
      };

      res.json(response);
    } catch (error) {
      console.error("Stats calculation error:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/users/technical-advisors", requireAuth, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      const isAdmin = currentUser?.role === "admin";

      // Get both technical advisors AND admins (they can review demands too)
      const advisors = await Promise.all([
        storage.getUsersByRole('technical_advisor'),
        storage.getUsersByRole('admin'),
      ]).then(([ta, admins]) => [...ta, ...admins]);
      
      // Admin gets email, non-admins only get id and username for assignments
      if (isAdmin) {
        res.json(advisors.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
        })));
      } else {
        res.json(advisors.map(u => ({
          id: u.id,
          username: u.username,
        })));
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch advisors" });
    }
  });

  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentUser = await storage.getUser(req.session.userId!);
      const isOwnProfile = req.params.id === req.session.userId;
      const isAdmin = currentUser?.role === "admin";

      // Return full profile only for own profile or if admin
      if (isOwnProfile || isAdmin) {
        res.json({
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          department: user.department,
          headquarters: user.headquarters,
          profilePicture: user.profilePicture,
        });
      } else {
        // Return only public profile data for other users
        res.json({
          id: user.id,
          username: user.username,
          profilePicture: user.profilePicture,
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.params.id, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
        email: updatedUser.email,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/notifications", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const notifications = await storage.getUserNotifications(req.session.userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const count = await storage.getUnreadNotificationCount(req.session.userId);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updated = await storage.markNotificationAsRead(req.params.id, req.session.userId);
      if (!updated) {
        return res.status(404).json({ message: "Notification not found or already read" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/mark-all-read", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      await storage.markAllNotificationsAsRead(req.session.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });


  app.post("/api/work-orders/demands", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentUser = await storage.getUserById(req.session.userId);
      if (!currentUser || currentUser.role !== 'technician') {
        return res.status(403).json({ message: "Only technicians can create demands" });
      }

      const technicianDemandSchema = z.object({
        title: z.string().min(1),
        priority: z.enum(["Normal", "High", "Urgent"]),
        department: z.enum(["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"]),
        headquarters: z.enum(["Montreal, QC", "Quebec, QC", "Saguenay, QC"]),
        customer: z.string().min(1),
        siteAddress: z.string().min(1),
        asset: z.string().min(1),
        problemSummary: z.string().min(1),
        advisorId: z.string().min(1),
        photos: z.array(z.string()).optional(),
      });

      const validatedInput = technicianDemandSchema.parse(req.body);

      const demandData: InsertWorkOrder = {
        title: validatedInput.title,
        priority: validatedInput.priority,
        department: validatedInput.department,
        headquarters: validatedInput.headquarters,
        customer: validatedInput.customer,
        siteAddress: validatedInput.siteAddress,
        asset: validatedInput.asset,
        problemSummary: validatedInput.problemSummary,
        photos: validatedInput.photos || [],
        createdBy: req.session.userId,
        demandedBy: req.session.userId,
        assignedTo: validatedInput.advisorId,
        tasks: [],
      };

      const workOrder = await storage.createWorkOrder(demandData);

      try {
        const technicalAdvisor = await storage.getUserById(validatedInput.advisorId);
        if (technicalAdvisor) {
          await storage.createNotification({
            userId: technicalAdvisor.id,
            type: 'work_order_demand',
            message: `New work order demand ${workOrder.workOrderNumber} from ${currentUser.username}`,
            workOrderId: workOrder.id,
          });

          if (technicalAdvisor.email) {
            await sendWorkOrderDemandEmail({
              to: technicalAdvisor.email,
              technician: currentUser.username,
              workOrderNumber: workOrder.workOrderNumber,
              title: workOrder.title,
              priority: workOrder.priority,
              customer: workOrder.customer,
              asset: workOrder.asset,
              problemSummary: workOrder.problemSummary,
            });
          }
        }
      } catch (emailError) {
        console.error('Failed to send demand email/notification:', emailError);
      }

      res.status(201).json(workOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create work order demand" });
    }
  });

  app.post("/api/work-orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const validatedData = insertWorkOrderSchema.parse({
        ...req.body,
        createdBy: req.session.userId,
      });

      const workOrder = await storage.createWorkOrder(validatedData);
      res.status(201).json(workOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create work order" });
    }
  });

  app.get("/api/work-orders", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrders = await storage.getAllWorkOrders();
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/assigned", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrders = await storage.getAssignedWorkOrders(req.session.userId);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assigned work orders" });
    }
  });

  app.get("/api/work-orders/demands", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentUser = await storage.getUserById(req.session.userId);
      if (!currentUser || (currentUser.role !== 'technical_advisor' && currentUser.role !== 'admin')) {
        return res.status(403).json({ message: "Only advisors can view demands" });
      }

      const allWorkOrders = await storage.getAllWorkOrders();
      const demands = allWorkOrders.filter(wo => wo.status === 'demand' && (currentUser.role === 'admin' || wo.demandedBy === currentUser.id));
      res.json(demands);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch demands" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrder = await storage.getWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }

      const punches = await storage.getWorkOrderPunches(req.params.id);
      res.json({ ...workOrder, punches });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });

  app.patch("/api/work-orders/:id/assign", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const workOrder = await storage.assignWorkOrder(req.params.id, userId);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }

      try {
        const assignedUser = await storage.getUserById(userId);
        if (assignedUser) {
          await storage.createNotification({
            userId: assignedUser.id,
            type: 'work_order_assigned',
            message: `Work order ${workOrder.workOrderNumber} has been assigned to you`,
            workOrderId: workOrder.id,
          });

          if (assignedUser.email) {
            await sendWorkOrderAssignmentEmail({
              to: assignedUser.email,
              assignedTo: assignedUser.username,
              workOrderNumber: workOrder.workOrderNumber,
              title: workOrder.title,
              priority: workOrder.priority,
              customer: workOrder.customer,
              asset: workOrder.asset,
            });
          }
        }
      } catch (notificationError) {
        console.error('Failed to send assignment notification:', notificationError);
      }

      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign work order" });
    }
  });

  app.patch("/api/work-orders/:id/close", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrder = await storage.closeWorkOrder(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }

      res.json(workOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to close work order" });
    }
  });


  app.get("/api/work-orders/:id/tasks", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const tasks = await storage.getWorkOrderTasks(req.params.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });



  // Get work order by work order number (e.g., W1, W2, W3)
  app.get("/api/work-orders/number/:workOrderNumber", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrder = await storage.getWorkOrderByNumber(req.params.workOrderNumber);
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }

      const tasks = await storage.getWorkOrderTasks(workOrder.id);
      const punches = await storage.getWorkOrderPunches(workOrder.id);
      res.json({ ...workOrder, tasks, punches });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch work order" });
    }
  });
  // Get current active time punch
  app.get("/api/time-punches/current", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const currentPunch = await storage.getCurrentWorkOrderPunch(req.session.userId);
      res.json(currentPunch || null);
    } catch (error) {
      console.error("Failed to get current punch:", error);
      res.status(500).json({ message: "Failed to get current punch" });
    }
  });

  // Get all time punches for current user for a specific date
  app.get("/api/time-punches/:userId/:date", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.params.userId;
      const date = req.params.date;

      if (userId !== req.session.userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const punches = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, userId),
          eq(timePunches.punchDate, date)
        ))
        .orderBy(desc(timePunches.clockIn));

      res.json(punches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time punches" });
    }
  });

  // Get all time punches for a work order
  app.get("/api/work-orders/:id/punches", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Anyone authenticated can view time punches for work orders
      const punches = await storage.getAllWorkOrderPunches(req.params.id);
      res.json(punches);
    } catch (error) {
      console.error("Failed to fetch work order punches:", error);
      res.status(500).json({ message: "Failed to fetch time punches" });
    }
  });

  // Update a time punch
  app.patch("/api/time-punches/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get the existing punch
      const existingPunch = await db.select().from(timePunches).where(eq(timePunches.id, req.params.id)).limit(1);
      if (!existingPunch || existingPunch.length === 0) {
        return res.status(404).json({ message: "Time punch not found" });
      }

      const punch = existingPunch[0];

      // Authorization: Check who can edit this punch
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Admin and technical_advisor can always edit any punch
      if (user.role !== "admin" && user.role !== "technical_advisor") {
        // Non-admin users have restrictions
        if (punch.workOrderId) {
          const workOrder = await storage.getWorkOrder(punch.workOrderId);
          if (!workOrder) {
            return res.status(404).json({ message: "Work order not found" });
          }

          // Check if work order is closed - non-admins cannot edit closed work orders
          if (workOrder.status === "completed" || workOrder.status === "closedForReview") {
            return res.status(403).json({ message: "Cannot edit punches on closed work orders" });
          }

          // Check authorization for open work orders
          const canEdit = 
            punch.userId === req.session.userId || 
            workOrder.assignedTo === req.session.userId;

          if (!canEdit) {
            return res.status(403).json({ message: "You are not authorized to edit this punch" });
          }
        } else {
          // For general punches (no work order), only owner can edit
          if (punch.userId !== req.session.userId) {
            return res.status(403).json({ message: "You are not authorized to edit this punch" });
          }
        }
      }

      // Require both clockIn and clockOut to be provided for editing
      const { clockIn, clockOut, kilometers } = req.body;
      if (!clockIn || !clockOut) {
        return res.status(400).json({ message: "Both clock in and clock out times are required" });
      }

      const updateData: any = {};
      updateData.clockIn = new Date(clockIn);
      updateData.clockOut = new Date(clockOut);
      // Skip kilometers update since the column doesn't exist yet
      // if (kilometers !== undefined) {
      //   updateData.kilometers = kilometers;
      // }

      // Validate timestamps: clockOut must be after clockIn
      if (updateData.clockOut.getTime() <= updateData.clockIn.getTime()) {
        return res.status(400).json({ message: "Clock out time must be after clock in time" });
      }
      
      // Ensure times are not in the future
      const now = new Date();
      if (updateData.clockIn > now) {
        return res.status(400).json({ message: "Clock in time cannot be in the future" });
      }
      if (updateData.clockOut > now) {
        return res.status(400).json({ message: "Clock out time cannot be in the future" });
      }
      
      // Ensure times are reasonable (not more than 24 hours)
      const duration = (updateData.clockOut.getTime() - updateData.clockIn.getTime()) / (1000 * 60 * 60);
      if (duration > 24) {
        return res.status(400).json({ message: "Time punch duration cannot exceed 24 hours" });
      }

      const updatedPunch = await storage.updateTimePunch(req.params.id, updateData);
      if (!updatedPunch) {
        return res.status(404).json({ message: "Time punch not found" });
      }

      // Update actual hours if this punch is for a work order
      if (updatedPunch.workOrderId) {
        try {
          const actualHours = await storage.calculateWorkOrderHours(updatedPunch.workOrderId);
          await storage.updateWorkOrder(updatedPunch.workOrderId, { actualHours });
        } catch (e) {
          console.error("Failed to update work order hours:", e);
        }
      }

      res.json(updatedPunch);
    } catch (error) {
      res.status(500).json({ message: "Failed to update time punch" });
    }
  });

  // Create a manual time punch
  app.post("/api/time-punches", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { clockIn, clockOut, punchType, punchDate, kilometers } = req.body;

      if (!clockIn || !clockOut || !punchType || !punchDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (punchType !== "work" && punchType !== "travel" && punchType !== "other") {
        return res.status(400).json({ message: "Invalid punch type" });
      }

      const clockInDate = new Date(clockIn);
      const clockOutDate = new Date(clockOut);

      if (clockOutDate.getTime() <= clockInDate.getTime()) {
        return res.status(400).json({ message: "Clock out must be after clock in" });
      }

      const duration = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);
      if (duration > 24) {
        return res.status(400).json({ message: "Duration cannot exceed 24 hours" });
      }

      const [punch] = await db
        .insert(timePunches)
        .values({
          userId: req.session.userId,
          clockIn: clockInDate,
          clockOut: clockOutDate,
          punchType,
          punchDate,
          workOrderId: null,
          taskId: null,
        })
        .returning();

      res.json(punch);
    } catch (error) {
      console.error("Create punch error:", error);
      res.status(500).json({ message: "Failed to create time punch" });
    }
  });

  // Delete a time punch
  app.delete("/api/time-punches/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get the existing punch
      const existingPunch = await db.select().from(timePunches).where(eq(timePunches.id, req.params.id)).limit(1);
      if (!existingPunch || existingPunch.length === 0) {
        return res.status(404).json({ message: "Time punch not found" });
      }

      const punch = existingPunch[0];

      // Authorization: Check who can delete this punch
      const user = await storage.getUserById(req.session.userId);
      // User may not exist in storage yet, but we can still allow deletion

      // Admin and technical_advisor can always delete any punch
      if (!(user && (user.role === "admin" || user.role === "technical_advisor"))) {
        // Non-admin users have restrictions
        if (punch.workOrderId) {
          const workOrder = await storage.getWorkOrder(punch.workOrderId);
          if (!workOrder) {
            return res.status(404).json({ message: "Work order not found" });
          }

          // Check if work order is closed - non-admins cannot delete from closed work orders
          if (workOrder.status === "completed" || workOrder.status === "closedForReview") {
            return res.status(403).json({ message: "Cannot delete punches on closed work orders" });
          }

          // Check authorization for open work orders
          const canDelete = 
            punch.userId === req.session.userId || 
            workOrder.assignedTo === req.session.userId;

          if (!canDelete) {
            return res.status(403).json({ message: "You are not authorized to delete this punch" });
          }
        } else {
          // For general punches (no work order), only owner can delete
          if (punch.userId !== req.session.userId) {
            return res.status(403).json({ message: "You are not authorized to delete this punch" });
          }
        }
      }

      await storage.deleteTimePunch(req.params.id);
      res.json({ message: "Time punch deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time punch" });
    }
  });

  // Appointments routes
  app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getAllAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/user/:userId", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getUserAppointments(req.params.userId);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user appointments" });
    }
  });

  app.get("/api/appointments/date/:date", requireAuth, async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsByDate(req.params.date);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments for date" });
    }
  });

  app.get("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment({
        ...validatedData,
        createdBy: req.session.userId!,
      });
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = updateAppointmentSchema.parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, validatedData);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", requireAuth, async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      await storage.deleteAppointment(req.params.id);
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Customers routes
  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || (user.role !== "admin" && user.role !== "technical_advisor")) {
        return res.status(403).json({ message: "Only admins and technical advisors can create customers" });
      }

      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer({
        ...validatedData,
        createdBy: req.session.userId!,
      });
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  // Messages routes
  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const { channelType, conversationId, headquarters, department, content } = req.body;

      // Build validated message data based on channel type
      let messageData: any = {
        senderId: req.session.userId!,
        channelType,
        content,
        headquarters: null,
        department: null,
        conversationId: null,
      };

      // Validate and set fields based on channel type
      if (channelType === 'headquarters') {
        if (!user.headquarters) {
          return res.status(400).json({ message: "User must have a headquarters set" });
        }
        if (headquarters !== user.headquarters) {
          return res.status(403).json({ message: "Access denied to this headquarters" });
        }
        messageData.headquarters = user.headquarters;
      } else if (channelType === 'department') {
        if (!user.department) {
          return res.status(400).json({ message: "User must have a department set" });
        }
        if (department !== user.department) {
          return res.status(403).json({ message: "Access denied to this department" });
        }
        messageData.department = user.department;
      } else if (channelType === 'direct') {
        if (!conversationId) {
          return res.status(400).json({ message: "ConversationId required for direct messages" });
        }
        const conversation = await storage.getConversationById(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        if (conversation.participant1 !== req.session.userId! && conversation.participant2 !== req.session.userId!) {
          return res.status(403).json({ message: "Access denied to this conversation" });
        }
        messageData.conversationId = conversationId;
      } else {
        return res.status(400).json({ message: "Invalid channel type" });
      }

      const validatedData = insertMessageSchema.parse(messageData);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get("/api/messages/headquarters/:headquarters", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (!user.headquarters || user.headquarters !== req.params.headquarters) {
        return res.status(403).json({ message: "Access denied to this headquarters channel" });
      }
      const messages = await storage.getMessagesByHeadquarters(req.params.headquarters);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/department/:department", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (!user.department || user.department !== req.params.department) {
        return res.status(403).json({ message: "Access denied to this department channel" });
      }
      const messages = await storage.getMessagesByDepartment(req.params.department);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get("/api/messages/conversation/:conversationId", requireAuth, async (req, res) => {
    try {
      const conversation = await storage.getConversationById(req.params.conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const userId = req.session.userId!;
      if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      const messages = await storage.getMessagesByConversation(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Conversations routes
  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { otherUserId } = req.body;
      const userId = req.session.userId!;

      // Prevent self-conversations
      if (userId === otherUserId) {
        return res.status(400).json({ message: "Cannot create conversation with yourself" });
      }

      // Check if conversation already exists
      const existing = await storage.getConversation(userId, otherUserId);
      if (existing) {
        return res.json(existing);
      }

      // Create new conversation with normalized participant order
      const conversation = await storage.createConversation({
        participant1: userId < otherUserId ? userId : otherUserId,
        participant2: userId < otherUserId ? otherUserId : userId,
      });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Conversation creation error:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations", requireAuth, async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.session.userId!);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Profile picture upload route
  const profilePictureUpload = multer({
    storage: multer.diskStorage({
      destination: 'uploads/profiles',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      }
    }),
    limits: { fileSize: 1024 * 1024 }, // 1MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post("/api/users/profile-picture", requireAuth, (req, res, next) => {
    profilePictureUpload.single('profilePicture')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: "File size too large (max 1MB)" });
          }
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = `/uploads/profiles/${req.file.filename}`;
      const user = await storage.updateUserProfilePicture(req.session.userId!, filePath);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ profilePicture: filePath });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  app.patch("/api/users/profile-picture/default", requireAuth, async (req, res) => {
    try {
      const { profilePicture } = req.body;
      
      if (!profilePicture) {
        return res.status(400).json({ message: "Profile picture path is required" });
      }

      const user = await storage.updateUserProfilePicture(req.session.userId!, profilePicture);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ profilePicture });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active WebSocket connections with user info
  const connections = new Map<WebSocket, { 
    userId: string; 
    headquarters: string | null;
    department: string | null;
  }>();

  wss.on('connection', async (ws, req) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const conn = connections.get(ws);

        if (message.type === 'auth') {
          // Authenticate the WebSocket connection
          const userId = message.userId;
          const user = await storage.getUser(userId);
          
          if (user) {
            connections.set(ws, { 
              userId, 
              headquarters: user.headquarters,
              department: user.department
            });
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_failed' }));
            ws.close();
          }
        } else if (!conn) {
          // Reject any non-auth message from unauthenticated connections
          ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
          ws.close();
          return;
        } else if (message.type === 'chat_message') {
          const { channelType, headquarters, department, conversationId, content } = message;
          
          // Validate required fields per channel type
          if (channelType === 'headquarters' && !headquarters) {
            ws.send(JSON.stringify({ type: 'error', message: 'Headquarters required for HQ messages' }));
            return;
          }
          if (channelType === 'department' && !department) {
            ws.send(JSON.stringify({ type: 'error', message: 'Department required for department messages' }));
            return;
          }
          if (channelType === 'direct' && !conversationId) {
            ws.send(JSON.stringify({ type: 'error', message: 'ConversationId required for direct messages' }));
            return;
          }

          // Verify user has access to the channel
          if (channelType === 'headquarters' && conn.headquarters !== headquarters) {
            ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this headquarters' }));
            return;
          }
          if (channelType === 'department' && conn.department !== department) {
            ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this department' }));
            return;
          }
          
          // ALWAYS revalidate user's current department/HQ from database on every message
          const currentUser = await storage.getUser(conn.userId);
          if (!currentUser) {
            ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
            ws.close();
            return;
          }

          // Update cached connection info
          connections.set(ws, {
            userId: conn.userId,
            headquarters: currentUser.headquarters,
            department: currentUser.department,
          });

          // Strict access validation with fresh database data
          if (channelType === 'headquarters') {
            if (!currentUser.headquarters || currentUser.headquarters !== headquarters) {
              ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this headquarters' }));
              return;
            }
          } else if (channelType === 'department') {
            if (!currentUser.department || currentUser.department !== department) {
              ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this department' }));
              return;
            }
          }

          // For direct messages, ALWAYS re-query conversation participants from storage
          let conversationParticipants: string[] = [];
          if (channelType === 'direct') {
            const conversation = await storage.getConversationById(conversationId);
            if (!conversation) {
              ws.send(JSON.stringify({ type: 'error', message: 'Conversation not found' }));
              return;
            }
            // Verify current user is still a participant (handles member removal)
            if (conversation.participant1 !== currentUser.id && conversation.participant2 !== currentUser.id) {
              ws.send(JSON.stringify({ type: 'error', message: 'Access denied to this conversation' }));
              return;
            }
            conversationParticipants = [conversation.participant1, conversation.participant2];
          }

          // Create the message in the database
          const newMessage = await storage.createMessage({
            senderId: conn.userId,
            channelType,
            headquarters: channelType === 'headquarters' ? headquarters : null,
            department: channelType === 'department' ? department : null,
            conversationId: channelType === 'direct' ? conversationId : null,
            content,
          });

          // Update conversation lastMessageAt if direct message
          if (channelType === 'direct' && conversationId) {
            await db.execute(sql`
              UPDATE conversations 
              SET last_message_at = NOW() 
              WHERE id = ${conversationId}
            `);
          }

          // Broadcast the message to appropriate recipients
          const broadcastMessage = JSON.stringify({
            type: 'new_message',
            message: newMessage,
          });

          connections.forEach((data, client) => {
            if (client.readyState === WebSocket.OPEN) {
              let shouldReceive = false;

              if (channelType === 'headquarters') {
                shouldReceive = data.headquarters === headquarters;
              } else if (channelType === 'department') {
                shouldReceive = data.department === department;
              } else if (channelType === 'direct') {
                // Only send to actual participants
                shouldReceive = conversationParticipants.includes(data.userId);
              }

              if (shouldReceive) {
                client.send(broadcastMessage);
              }
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      connections.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      connections.delete(ws);
    });
  });

  // Update work order notes
  app.patch("/api/work-orders/:id/notes", requireAuth, async (req, res) => {
    try {
      const { notes } = req.body;
      if (notes === undefined) {
        return res.status(400).json({ message: "Notes content is required" });
      }

      const workOrder = await storage.updateWorkOrder(req.params.id, { notes });
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }

      res.json({ notes: workOrder.notes });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notes" });
    }
  });

  // Update work order photos/attachments
  app.patch("/api/work-orders/:id/photos", requireAuth, async (req, res) => {
    try {
      const { photos } = req.body;
      if (!Array.isArray(photos)) {
        return res.status(400).json({ message: "Photos must be an array" });
      }

      const workOrder = await storage.updateWorkOrder(req.params.id, { photos });
      if (!workOrder) {
        return res.status(404).json({ message: "Work order not found" });
      }

      res.json({ photos: workOrder.photos });
    } catch (error) {
      res.status(500).json({ message: "Failed to update photos" });
    }
  });

  // Get or create conversation
  app.post("/api/conversations", requireAuth, async (req, res) => {
    try {
      const { otherUserId, participantId } = req.body;
      const userId = otherUserId || participantId;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      let conversation = await storage.getOrCreateConversation(req.session.userId!, userId);
      if (!conversation) {
        return res.status(500).json({ message: "Failed to create conversation" });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Failed to get or create conversation:", error);
      res.status(500).json({ message: "Failed to get or create conversation" });
    }
  });

  // Get current active punch
  app.get("/api/active-punch", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const activePunch = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, req.session.userId),
          isNull(timePunches.clockOut)
        ))
        .limit(1);

      res.json(activePunch?.[0] || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active punch" });
    }
  });

  // Quick clock in
  app.post("/api/time-punches/clock-in", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { punchType, workOrderId, clockInTime } = req.body;

      if (!punchType) {
        return res.status(400).json({ message: "punchType is required" });
      }

      if (punchType !== "work" && punchType !== "travel" && punchType !== "other") {
        return res.status(400).json({ message: "Invalid punch type" });
      }

      // Check if user already has ANY active punch (enforce only 1 active punch per user)
      const existingPunch = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, req.session.userId),
          isNull(timePunches.clockOut)
        ))
        .limit(1);

      if (existingPunch?.length > 0) {
        return res.status(400).json({ message: "You already have an active punch. Please clock out first." });
      }

      const now = clockInTime ? new Date(clockInTime) : new Date();
      const punchDate = now.toISOString().split("T")[0];
      
      const [punch] = await db
        .insert(timePunches)
        .values({
          userId: req.session.userId,
          clockIn: now,
          punchType,
          workOrderId: workOrderId || null,
          taskId: null,
          punchDate,
        })
        .returning();

      // Update work order status if punching into one
      if (workOrderId && punchType === "work") {
        try {
          const workOrder = await storage.getWorkOrder(workOrderId);
          if (workOrder && workOrder.status === "assigned") {
            await storage.updateWorkOrder(workOrderId, { status: "in-progress" });
          }
          
          // Calculate and update actual hours for the work order
          const actualHours = await storage.calculateWorkOrderHours(workOrderId);
          await storage.updateWorkOrder(workOrderId, { actualHours });
        } catch (e) {
          console.error("Failed to update work order status:", e);
        }
      }

      res.json(punch);
    } catch (error) {
      console.error("Clock in error:", error);
      res.status(500).json({ message: "Failed to clock in" });
    }
  });

  // Quick clock out
  app.post("/api/time-punches/clock-out", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { kilometers, clockOutTime } = req.body;

      const activePunch = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, req.session.userId),
          isNull(timePunches.clockOut)
        ))
        .limit(1);

      if (!activePunch || activePunch.length === 0) {
        return res.status(400).json({ message: "No active punch found" });
      }

      const punch = activePunch[0];
      const now = clockOutTime ? new Date(clockOutTime) : new Date();

      const updateData: any = {
        clockOut: now,
      };

      if (kilometers !== undefined && kilometers !== null) {
        updateData.kilometers = kilometers;
      }

      const [updatedPunch] = await db
        .update(timePunches)
        .set(updateData)
        .where(eq(timePunches.id, punch.id))
        .returning();

      // Update actual hours if this punch is for a work order
      if (punch.workOrderId) {
        try {
          const actualHours = await storage.calculateWorkOrderHours(punch.workOrderId);
          await storage.updateWorkOrder(punch.workOrderId, { actualHours });
        } catch (e) {
          console.error("Failed to update work order hours:", e);
        }
      }

      res.json(updatedPunch);
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ message: "Failed to clock out" });
    }
  });

  // Work order punch in
  app.post("/api/work-orders/:id/punch-in", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrderId = req.params.id;

      // Check if user already has ANY active punch (enforce only 1 active punch per user)
      const existingPunch = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, req.session.userId),
          isNull(timePunches.clockOut)
        ))
        .limit(1);

      if (existingPunch?.length > 0) {
        return res.status(400).json({ message: "You already have an active punch. Please clock out first." });
      }

      const now = new Date();
      const punchDate = now.toISOString().split("T")[0];
      
      const [punch] = await db
        .insert(timePunches)
        .values({
          userId: req.session.userId,
          clockIn: now,
          punchType: "work",
          workOrderId,
          taskId: null,
          punchDate,
        })
        .returning();

      // Update work order status if punching into one
      try {
        const workOrder = await storage.getWorkOrder(workOrderId);
        if (workOrder && workOrder.status === "assigned") {
          await storage.updateWorkOrder(workOrderId, { status: "in-progress" });
        }
        
        // Calculate and update actual hours for the work order
        const actualHours = await storage.calculateWorkOrderHours(workOrderId);
        await storage.updateWorkOrder(workOrderId, { actualHours });
      } catch (e) {
        console.error("Failed to update work order status:", e);
      }

      res.json(punch);
    } catch (error) {
      console.error("Work order punch in error:", error);
      res.status(500).json({ message: "Failed to punch in" });
    }
  });

  // Work order punch out
  app.post("/api/work-orders/:id/punch-out", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const workOrderId = req.params.id;

      const activePunch = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, req.session.userId),
          eq(timePunches.workOrderId, workOrderId),
          isNull(timePunches.clockOut)
        ))
        .limit(1);

      if (!activePunch || activePunch.length === 0) {
        return res.status(400).json({ message: "No active punch found for this work order" });
      }

      const punch = activePunch[0];
      const now = new Date();

      const [updatedPunch] = await db
        .update(timePunches)
        .set({ clockOut: now })
        .where(eq(timePunches.id, punch.id))
        .returning();

      // Update actual hours for the work order
      try {
        const actualHours = await storage.calculateWorkOrderHours(workOrderId);
        await storage.updateWorkOrder(workOrderId, { actualHours });
      } catch (e) {
        console.error("Failed to update work order hours:", e);
      }

      res.json(updatedPunch);
    } catch (error) {
      console.error("Work order punch out error:", error);
      res.status(500).json({ message: "Failed to punch out" });
    }
  });

  // Task punch in/out toggle endpoint
  app.post("/api/tasks/:id/punch", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const taskId = req.params.id;
      const { workOrderId } = req.body;

      // Check if user has an active punch for this task
      const activePunch = await db
        .select()
        .from(timePunches)
        .where(and(
          eq(timePunches.userId, req.session.userId),
          eq(timePunches.taskId, taskId),
          isNull(timePunches.clockOut)
        ))
        .limit(1);

      if (activePunch && activePunch.length > 0) {
        // Punch out
        const punch = activePunch[0];
        const now = new Date();

        const [updatedPunch] = await db
          .update(timePunches)
          .set({ clockOut: now })
          .where(eq(timePunches.id, punch.id))
          .returning();

        // Update actual hours if this punch is for a work order
        if (workOrderId) {
          try {
            const actualHours = await storage.calculateWorkOrderHours(workOrderId);
            await storage.updateWorkOrder(workOrderId, { actualHours });
          } catch (e) {
            console.error("Failed to update work order hours:", e);
          }
        }

        res.json(updatedPunch);
      } else {
        // Punch in
        // Check if user already has ANY active punch
        const existingPunch = await db
          .select()
          .from(timePunches)
          .where(and(
            eq(timePunches.userId, req.session.userId),
            isNull(timePunches.clockOut)
          ))
          .limit(1);

        if (existingPunch?.length > 0) {
          return res.status(400).json({ message: "You already have an active punch. Please clock out first." });
        }

        const now = new Date();
        const punchDate = now.toISOString().split("T")[0];
        
        const [punch] = await db
          .insert(timePunches)
          .values({
            userId: req.session.userId,
            clockIn: now,
            punchType: "work",
            workOrderId: workOrderId || null,
            taskId,
            punchDate,
          })
          .returning();

        // Update work order status if punching into one
        if (workOrderId) {
          try {
            const workOrder = await storage.getWorkOrder(workOrderId);
            if (workOrder && workOrder.status === "assigned") {
              await storage.updateWorkOrder(workOrderId, { status: "in-progress" });
            }
            
            // Calculate and update actual hours for the work order
            const actualHours = await storage.calculateWorkOrderHours(workOrderId);
            await storage.updateWorkOrder(workOrderId, { actualHours });
          } catch (e) {
            console.error("Failed to update work order status:", e);
          }
        }

        res.json(punch);
      }
    } catch (error) {
      console.error("Task punch error:", error);
      res.status(500).json({ message: "Failed to toggle punch" });
    }
  });

  // Add break endpoint
  app.post("/api/add-break", requireAuth, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { breakMinutes } = req.body;
      if (!breakMinutes || breakMinutes < 1 || breakMinutes > 480) {
        return res.status(400).json({ message: "Break duration must be between 1 and 480 minutes" });
      }

      const now = new Date();
      const breakStartTime = new Date(now.getTime() - breakMinutes * 60 * 1000); // Start time is breakMinutes ago
      const punchDate = now.toISOString().split("T")[0];

      // Create a break punch record
      const [breakPunch] = await db
        .insert(timePunches)
        .values({
          userId: req.session.userId,
          clockIn: breakStartTime,
          clockOut: now,
          punchType: "other", // Track breaks as "other" type
          punchDate,
        })
        .returning();

      res.json(breakPunch);
    } catch (error) {
      console.error("Add break error:", error);
      res.status(500).json({ message: "Failed to add break" });
    }
  });

  // Machines and Parts endpoints
  // Get all machines
  app.get("/api/machines", requireAuth, async (req, res) => {
    try {
      const { machines: machinesTable } = await import("@shared/schema");
      const machinesList = await db.select().from(machinesTable);
      console.log(`Fetched ${machinesList.length} machines`);
      res.json(machinesList);
    } catch (error) {
      console.error("Failed to fetch machines:", error);
      res.status(500).json({ message: "Failed to fetch machines" });
    }
  });

  // Create a new machine
  app.post("/api/machines", requireAuth, async (req, res) => {
    try {
      const { name, model, serialNumber, category, status, location, notes } = req.body;

      // Validate required fields
      if (!name || !model || !serialNumber || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { machines: machinesTable } = await import("@shared/schema");
      const [newMachine] = await db
        .insert(machinesTable)
        .values({
          name,
          model,
          serialNumber,
          category,
          status: status || "in-stock",
          location: location || null,
          notes: notes || null,
          lastServiceDate: null,
          nextServiceDate: null,
        })
        .returning();

      res.json(newMachine);
    } catch (error: any) {
      console.error("Failed to create machine:", error);
      if (error.message?.includes("duplicate")) {
        return res.status(400).json({ message: "Serial number already exists" });
      }
      res.status(500).json({ message: "Failed to create machine" });
    }
  });

  // Update a machine
  app.patch("/api/machines/:id", requireAuth, async (req, res) => {
    try {
      const { name, model, category, status, location, notes } = req.body;

      const { machines: machinesTable } = await import("@shared/schema");
      const [updated] = await db
        .update(machinesTable)
        .set({
          name: name || undefined,
          model: model || undefined,
          category: category || undefined,
          status: status || undefined,
          location: location === null ? null : (location || undefined),
          notes: notes === null ? null : (notes || undefined),
        })
        .where(eq(machinesTable.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Machine not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update machine:", error);
      res.status(500).json({ message: "Failed to update machine" });
    }
  });

  // Delete a machine
  app.delete("/api/machines/:id", requireAuth, async (req, res) => {
    try {
      const { machines: machinesTable } = await import("@shared/schema");
      await db.delete(machinesTable).where(eq(machinesTable.id, req.params.id));
      res.json({ message: "Machine deleted successfully" });
    } catch (error) {
      console.error("Failed to delete machine:", error);
      res.status(500).json({ message: "Failed to delete machine" });
    }
  });

  // Get all parts
  app.get("/api/parts", requireAuth, async (req, res) => {
    try {
      const { parts: partsTable } = await import("@shared/schema");
      const partsList = await db.select().from(partsTable);
      console.log(`Fetched ${partsList.length} parts`);
      res.json(partsList);
    } catch (error) {
      console.error("Failed to fetch parts:", error);
      res.status(500).json({ message: "Failed to fetch parts" });
    }
  });

  // Create a new part
  app.post("/api/parts", requireAuth, async (req, res) => {
    try {
      const { name, partNumber, category, quantity, unitCost, supplier, location, description, reorderLevel } = req.body;

      if (!name || !partNumber || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { parts: partsTable } = await import("@shared/schema");
      const [newPart] = await db
        .insert(partsTable)
        .values({
          name,
          partNumber,
          category,
          quantity: quantity || 0,
          unitCost: unitCost ? parseFloat(unitCost) : null,
          supplier: supplier || null,
          location: location || null,
          description: description || null,
          reorderLevel: reorderLevel || 5,
        })
        .returning();

      res.json(newPart);
    } catch (error: any) {
      console.error("Failed to create part:", error);
      if (error.message?.includes("duplicate")) {
        return res.status(400).json({ message: "Part number already exists" });
      }
      res.status(500).json({ message: "Failed to create part" });
    }
  });

  // Update a part
  app.patch("/api/parts/:id", requireAuth, async (req, res) => {
    try {
      const { name, category, quantity, unitCost, supplier, location, description, reorderLevel } = req.body;

      const { parts: partsTable } = await import("@shared/schema");
      const [updated] = await db
        .update(partsTable)
        .set({
          name: name || undefined,
          category: category || undefined,
          quantity: quantity !== undefined ? quantity : undefined,
          unitCost: unitCost !== undefined ? (unitCost ? parseFloat(unitCost) : null) : undefined,
          supplier: supplier === null ? null : (supplier || undefined),
          location: location === null ? null : (location || undefined),
          description: description === null ? null : (description || undefined),
          reorderLevel: reorderLevel !== undefined ? reorderLevel : undefined,
        })
        .where(eq(partsTable.id, req.params.id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Part not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update part:", error);
      res.status(500).json({ message: "Failed to update part" });
    }
  });

  // Delete a part
  app.delete("/api/parts/:id", requireAuth, async (req, res) => {
    try {
      const { parts: partsTable } = await import("@shared/schema");
      await db.delete(partsTable).where(eq(partsTable.id, req.params.id));
      res.json({ message: "Part deleted successfully" });
    } catch (error) {
      console.error("Failed to delete part:", error);
      res.status(500).json({ message: "Failed to delete part" });
    }
  });

  return httpServer;
}
