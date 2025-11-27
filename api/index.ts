import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq, and, desc, sql, isNull } from "drizzle-orm";

// Configure neon for serverless
neonConfig.webSocketConstructor = ws;

const app = express();

app.set("trust proxy", 1);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

// Use memory store for sessions in serverless environment
// Note: For production, consider using a Redis-based session store
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: "lax",
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database connection for serverless
const getDb = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle({ client: pool, schema });
};

// Import schema tables
const { users, timePunches, workOrders, workOrderTasks, notifications, appointments, messages, customers, conversations } = schema;

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

// Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const db = getDb();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username));
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
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/api/auth/user", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
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
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to get user" });
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

app.get("/api/users", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const [currentUser] = await db.select().from(users).where(eq(users.id, req.session.userId!));
    const isAdmin = currentUser?.role === "admin";

    const allUsers = await db.select().from(users).orderBy(users.username);

    if (isAdmin) {
      res.json(allUsers.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        email: u.email,
        department: u.department,
        isActive: u.isActive,
      })));
    } else {
      res.json(allUsers.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
      })));
    }
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.get("/api/work-orders", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const allWorkOrders = await db.select().from(workOrders).orderBy(desc(workOrders.createdAt));
    res.json(allWorkOrders);
  } catch (error) {
    console.error("Get work orders error:", error);
    res.status(500).json({ message: "Failed to fetch work orders" });
  }
});

app.get("/api/work-orders/assigned", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const assignedWorkOrders = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.assignedTo, req.session.userId!))
      .orderBy(desc(workOrders.createdAt));
    res.json(assignedWorkOrders);
  } catch (error) {
    console.error("Get assigned work orders error:", error);
    res.status(500).json({ message: "Failed to fetch assigned work orders" });
  }
});

app.get("/api/work-orders/:id", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const [workOrder] = await db.select().from(workOrders).where(eq(workOrders.id, req.params.id));
    if (!workOrder) {
      return res.status(404).json({ message: "Work order not found" });
    }

    const punches = await db
      .select()
      .from(timePunches)
      .where(eq(timePunches.workOrderId, req.params.id))
      .orderBy(desc(timePunches.clockIn));

    res.json({ ...workOrder, punches });
  } catch (error) {
    console.error("Get work order error:", error);
    res.status(500).json({ message: "Failed to fetch work order" });
  }
});

app.get("/api/active-punch", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const [activePunch] = await db
      .select()
      .from(timePunches)
      .where(and(
        eq(timePunches.userId, req.session.userId!),
        isNull(timePunches.clockOut)
      ))
      .limit(1);

    res.json(activePunch || null);
  } catch (error) {
    console.error("Get active punch error:", error);
    res.status(500).json({ message: "Failed to fetch active punch" });
  }
});

app.get("/api/appointments", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const allAppointments = await db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
    res.json(allAppointments);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.session.userId!))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    res.json(userNotifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, req.session.userId!),
        eq(notifications.isRead, 'false')
      ));
    res.json({ count: result[0]?.count || 0 });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

app.get("/api/customers", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const allCustomers = await db.select().from(customers).orderBy(desc(customers.createdAt));
    res.json(allCustomers);
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

app.get("/api/conversations", requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userConversations = await db
      .select()
      .from(conversations)
      .where(sql`${conversations.participant1} = ${req.session.userId!} OR ${conversations.participant2} = ${req.session.userId!}`)
      .orderBy(desc(conversations.lastMessageAt));
    res.json(userConversations);
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export for Vercel
export default app;
