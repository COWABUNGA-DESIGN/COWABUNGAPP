import { users, timePunches, workOrders, workOrderTasks, notifications, appointments, messages, customers, conversations, type User, type InsertUser, type UpdateUser, type TimePunch, type InsertTimePunch, type WorkOrder, type InsertWorkOrder, type WorkOrderTask, type InsertTask, type Notification, type InsertNotification, type Appointment, type InsertAppointment, type UpdateAppointment, type Message, type InsertMessage, type Customer, type InsertCustomer, type Conversation, type InsertConversation } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, isNull, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  getUserByRole(role: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: UpdateUser): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(id: string, userId: string): Promise<boolean>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  
  clockIn(userId: string): Promise<TimePunch>;
  clockOut(userId: string): Promise<TimePunch | undefined>;
  getCurrentPunch(userId: string): Promise<TimePunch | undefined>;
  getTodayPunches(userId: string): Promise<TimePunch[]>;
  getWeekPunches(userId: string): Promise<TimePunch[]>;
  
  createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder>;
  getAllWorkOrders(): Promise<WorkOrder[]>;
  getWorkOrder(id: string): Promise<WorkOrder | undefined>;
  getWorkOrderByNumber(workOrderNumber: string): Promise<WorkOrder | undefined>;
  updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder | undefined>;
  assignWorkOrder(id: string, userId: string): Promise<WorkOrder | undefined>;
  closeWorkOrder(id: string): Promise<WorkOrder | undefined>;
  getAssignedWorkOrders(userId: string): Promise<WorkOrder[]>;
  
  createTask(task: Omit<InsertTask, 'workOrderId'> & { workOrderId: string }): Promise<WorkOrderTask>;
  getWorkOrderTasks(workOrderId: string): Promise<WorkOrderTask[]>;
  updateTask(id: string, data: Partial<WorkOrderTask>): Promise<WorkOrderTask | undefined>;
  deleteTask(id: string): Promise<void>;
  calculateTotalBudgetedHours(workOrderId: string): Promise<number>;
  
  clockInTask(userId: string, taskId: string, workOrderId: string): Promise<TimePunch>;
  clockOutTask(userId: string, taskId?: string): Promise<TimePunch | undefined>;
  getCurrentTaskPunch(userId: string, taskId?: string): Promise<TimePunch | undefined>;
  getTaskPunches(taskId: string): Promise<TimePunch[]>;
  calculateTaskHours(taskId: string): Promise<number>;
  calculateWorkOrderHours(workOrderId: string): Promise<number>;
  updateTimePunch(id: string, data: Partial<TimePunch>): Promise<TimePunch | undefined>;
  deleteTimePunch(id: string): Promise<void>;
  getAllWorkOrderPunches(workOrderId: string): Promise<TimePunch[]>;
  
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAllAppointments(): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, data: UpdateAppointment): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<void>;
  getUserAppointments(userId: string): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByHeadquarters(headquarters: string): Promise<Message[]>;
  getMessagesByDepartment(department: string): Promise<Message[]>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getUserConversations(userId: string): Promise<Conversation[]>;
  getConversation(participant1: string, participant2: string): Promise<Conversation | undefined>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation>;
  
  createCustomer(customer: InsertCustomer & { createdBy: string }): Promise<Customer>;
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  
  updateUserProfilePicture(userId: string, profilePicture: string): Promise<User | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.employeeId, employeeId));
    return user || undefined;
  }

  async getUserByRole(role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.role, role as any));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const passwordHash = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        username: insertUser.username,
        employeeId: insertUser.employeeId,
        passwordHash,
        role: insertUser.role ?? "technician",
        email: insertUser.email && insertUser.email !== "" ? insertUser.email : null,
        department: insertUser.department || null,
        occupation: insertUser.occupation || null,
        headquarters: insertUser.headquarters || null,
        profilePicture: "/default-avatar.jpeg",
      })
      .returning();
    return user;
  }

  async updateUser(id: string, data: UpdateUser): Promise<User | undefined> {
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (data.email !== undefined) updateData.email = data.email && data.email !== "" ? data.email : null;
    if (data.department !== undefined) updateData.department = data.department || null;
    if (data.occupation !== undefined) updateData.occupation = data.occupation || null;
    if (data.headquarters !== undefined) updateData.headquarters = data.headquarters || null;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture && data.profilePicture !== "" ? data.profilePicture : null;
    if (data.bannerImage !== undefined) updateData.bannerImage = data.bannerImage && data.bannerImage !== "" ? data.bannerImage : null;
    if (data.mood !== undefined) updateData.mood = data.mood;

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, 'false')
      ));
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: 'true' })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId)
      ))
      .returning();
    return result.length > 0;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: 'true' })
      .where(eq(notifications.userId, userId));
  }

  async clockIn(userId: string): Promise<TimePunch> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const [punch] = await db
      .insert(timePunches)
      .values({
        userId,
        punchType: "work",
        clockIn: now,
        punchDate: today,
      })
      .returning();
    return punch;
  }

  async clockOut(userId: string): Promise<TimePunch | undefined> {
    const currentPunch = await this.getCurrentPunch(userId);
    if (!currentPunch) return undefined;

    const [punch] = await db
      .update(timePunches)
      .set({ clockOut: new Date() })
      .where(eq(timePunches.id, currentPunch.id))
      .returning();
    return punch;
  }

  async getCurrentPunch(userId: string): Promise<TimePunch | undefined> {
    const [punch] = await db
      .select()
      .from(timePunches)
      .where(and(
        eq(timePunches.userId, userId),
        isNull(timePunches.clockOut)
      ))
      .orderBy(desc(timePunches.clockIn))
      .limit(1);
    return punch || undefined;
  }

  async getTodayPunches(userId: string): Promise<TimePunch[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db
      .select()
      .from(timePunches)
      .where(and(
        eq(timePunches.userId, userId),
        eq(timePunches.punchDate, today)
      ))
      .orderBy(desc(timePunches.clockIn));
  }

  async getWeekPunches(userId: string): Promise<TimePunch[]> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    return await db
      .select()
      .from(timePunches)
      .where(and(
        eq(timePunches.userId, userId),
        gte(timePunches.punchDate, weekStartStr)
      ))
      .orderBy(desc(timePunches.clockIn));
  }

  async createWorkOrder(insertWorkOrder: InsertWorkOrder): Promise<WorkOrder> {
    const { tasks, ...workOrderData } = insertWorkOrder;
    
    // Get the count of existing work orders to generate the next number
    const existingWorkOrders = await db
      .select()
      .from(workOrders)
      .orderBy(desc(workOrders.createdAt));
    
    const nextNumber = existingWorkOrders.length + 1;
    const workOrderNumber = `W${nextNumber}`;
    
    const [workOrder] = await db
      .insert(workOrders)
      .values({
        ...workOrderData,
        workOrderNumber,
      })
      .returning();
    
    if (tasks && tasks.length > 0) {
      await db.insert(workOrderTasks).values(
        tasks.map((task, index) => ({
          workOrderId: workOrder.id,
          title: task.title,
          description: task.description || null,
          budgetedHours: task.budgetedHours,
          sortOrder: index,
        }))
      );
    }
    
    return workOrder;
  }

  async getAllWorkOrders(): Promise<WorkOrder[]> {
    return await db
      .select()
      .from(workOrders)
      .orderBy(desc(workOrders.createdAt));
  }

  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const [workOrder] = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.id, id));
    return workOrder || undefined;
  }

  async getWorkOrderByNumber(workOrderNumber: string): Promise<WorkOrder | undefined> {
    const [workOrder] = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.workOrderNumber, workOrderNumber));
    return workOrder || undefined;
  }

  async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder | undefined> {
    const [workOrder] = await db
      .update(workOrders)
      .set(data)
      .where(eq(workOrders.id, id))
      .returning();
    return workOrder || undefined;
  }

  async assignWorkOrder(id: string, userId: string): Promise<WorkOrder | undefined> {
    const [workOrder] = await db
      .update(workOrders)
      .set({ 
        assignedTo: userId,
        status: "assigned" 
      })
      .where(eq(workOrders.id, id))
      .returning();
    return workOrder || undefined;
  }

  async closeWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const actualHours = await this.calculateWorkOrderHours(id);
    const budgetedHours = await this.calculateTotalBudgetedHours(id);
    const workOrder = await this.getWorkOrder(id);
    if (!workOrder) return undefined;

    let efficiency: number | null = null;
    if (actualHours > 0 && budgetedHours > 0) {
      efficiency = (budgetedHours / actualHours) * 100;
    }

    const [updated] = await db
      .update(workOrders)
      .set({ 
        status: "completed",
        actualHours,
        efficiency,
        completedAt: new Date()
      })
      .where(eq(workOrders.id, id))
      .returning();
    return updated || undefined;
  }

  async getAssignedWorkOrders(userId: string): Promise<WorkOrder[]> {
    return await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.assignedTo, userId))
      .orderBy(desc(workOrders.createdAt));
  }

  async clockInWorkOrder(userId: string, workOrderId: string): Promise<TimePunch> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const [punch] = await db
      .insert(timePunches)
      .values({
        userId,
        workOrderId,
        punchType: "work",
        clockIn: now,
        punchDate: today,
      })
      .returning();

    await db
      .update(workOrders)
      .set({ status: "in-progress" })
      .where(eq(workOrders.id, workOrderId));

    return punch;
  }

  async clockOutWorkOrder(userId: string, workOrderId?: string): Promise<TimePunch | undefined> {
    const currentPunch = await this.getCurrentWorkOrderPunch(userId, workOrderId);
    if (!currentPunch) return undefined;

    const [punch] = await db
      .update(timePunches)
      .set({ clockOut: new Date() })
      .where(eq(timePunches.id, currentPunch.id))
      .returning();

    if (currentPunch.workOrderId) {
      const actualHours = await this.calculateWorkOrderHours(currentPunch.workOrderId);
      await db
        .update(workOrders)
        .set({ actualHours })
        .where(eq(workOrders.id, currentPunch.workOrderId));
    }

    return punch;
  }

  async getCurrentWorkOrderPunch(userId: string, workOrderId?: string): Promise<TimePunch | undefined> {
    const conditions = [
      eq(timePunches.userId, userId),
      isNull(timePunches.clockOut)
    ];
    
    if (workOrderId) {
      conditions.push(eq(timePunches.workOrderId, workOrderId));
    }

    const [punch] = await db
      .select()
      .from(timePunches)
      .where(and(...conditions))
      .orderBy(desc(timePunches.clockIn))
      .limit(1);
    return punch || undefined;
  }

  async getWorkOrderPunches(workOrderId: string): Promise<TimePunch[]> {
    return await db
      .select()
      .from(timePunches)
      .where(eq(timePunches.workOrderId, workOrderId))
      .orderBy(desc(timePunches.clockIn));
  }

  async calculateWorkOrderHours(workOrderId: string): Promise<number> {
    const punches = await this.getWorkOrderPunches(workOrderId);
    let totalHours = 0;

    for (const punch of punches) {
      if (punch.clockOut && punch.punchType === "work") {
        const clockIn = new Date(punch.clockIn).getTime();
        const clockOut = new Date(punch.clockOut).getTime();
        const hours = (clockOut - clockIn) / (1000 * 60 * 60);
        totalHours += hours;
      }
    }

    return totalHours;
  }

  async createTask(task: Omit<InsertTask, 'workOrderId'> & { workOrderId: string }): Promise<WorkOrderTask> {
    const [newTask] = await db
      .insert(workOrderTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getWorkOrderTasks(workOrderId: string): Promise<WorkOrderTask[]> {
    return await db
      .select()
      .from(workOrderTasks)
      .where(eq(workOrderTasks.workOrderId, workOrderId))
      .orderBy(workOrderTasks.sortOrder);
  }

  async updateTask(id: string, data: Partial<WorkOrderTask>): Promise<WorkOrderTask | undefined> {
    const [task] = await db
      .update(workOrderTasks)
      .set(data)
      .where(eq(workOrderTasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db
      .delete(workOrderTasks)
      .where(eq(workOrderTasks.id, id));
  }

  async calculateTotalBudgetedHours(workOrderId: string): Promise<number> {
    const tasks = await this.getWorkOrderTasks(workOrderId);
    return tasks.reduce((total, task) => total + task.budgetedHours, 0);
  }

  async clockInTask(userId: string, taskId: string, workOrderId: string): Promise<TimePunch> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const [punch] = await db
      .insert(timePunches)
      .values({
        userId,
        taskId,
        workOrderId,
        punchType: "work",
        clockIn: now,
        punchDate: today,
      })
      .returning();

    await db
      .update(workOrders)
      .set({ status: "in-progress" })
      .where(eq(workOrders.id, workOrderId));

    return punch;
  }

  async clockOutTask(userId: string, taskId?: string): Promise<TimePunch | undefined> {
    const currentPunch = await this.getCurrentTaskPunch(userId, taskId);
    if (!currentPunch) return undefined;

    const [punch] = await db
      .update(timePunches)
      .set({ clockOut: new Date() })
      .where(eq(timePunches.id, currentPunch.id))
      .returning();

    if (currentPunch.workOrderId) {
      const actualHours = await this.calculateWorkOrderHours(currentPunch.workOrderId);
      await db
        .update(workOrders)
        .set({ actualHours })
        .where(eq(workOrders.id, currentPunch.workOrderId));
    }

    return punch;
  }

  async getCurrentTaskPunch(userId: string, taskId?: string): Promise<TimePunch | undefined> {
    const conditions = [
      eq(timePunches.userId, userId),
      eq(timePunches.punchType, "work"),
      isNull(timePunches.clockOut)
    ];
    
    if (taskId) {
      conditions.push(eq(timePunches.taskId, taskId));
    }

    const [punch] = await db
      .select()
      .from(timePunches)
      .where(and(...conditions))
      .orderBy(desc(timePunches.clockIn))
      .limit(1);
    return punch || undefined;
  }


  async getTaskPunches(taskId: string): Promise<TimePunch[]> {
    return await db
      .select()
      .from(timePunches)
      .where(eq(timePunches.taskId, taskId))
      .orderBy(desc(timePunches.clockIn));
  }

  async calculateTaskHours(taskId: string): Promise<number> {
    const punches = await this.getTaskPunches(taskId);
    let totalHours = 0;

    for (const punch of punches) {
      if (punch.clockOut && punch.punchType === "work") {
        const clockIn = new Date(punch.clockIn).getTime();
        const clockOut = new Date(punch.clockOut).getTime();
        const hours = (clockOut - clockIn) / (1000 * 60 * 60);
        totalHours += hours;
      }
    }

    return totalHours;
  }

  async updateTimePunch(id: string, data: Partial<TimePunch>): Promise<TimePunch | undefined> {
    const [punch] = await db
      .update(timePunches)
      .set(data)
      .where(eq(timePunches.id, id))
      .returning();
    
    if (punch && punch.workOrderId) {
      const actualHours = await this.calculateWorkOrderHours(punch.workOrderId);
      await db
        .update(workOrders)
        .set({ actualHours })
        .where(eq(workOrders.id, punch.workOrderId));
    }
    
    return punch || undefined;
  }

  async deleteTimePunch(id: string): Promise<void> {
    const [punch] = await db
      .select()
      .from(timePunches)
      .where(eq(timePunches.id, id));
    
    await db
      .delete(timePunches)
      .where(eq(timePunches.id, id));
    
    if (punch && punch.workOrderId) {
      const actualHours = await this.calculateWorkOrderHours(punch.workOrderId);
      await db
        .update(workOrders)
        .set({ actualHours })
        .where(eq(workOrders.id, punch.workOrderId));
    }
  }

  async getAllWorkOrderPunches(workOrderId: string): Promise<TimePunch[]> {
    return await db
      .select()
      .from(timePunches)
      .where(eq(timePunches.workOrderId, workOrderId))
      .orderBy(timePunches.clockIn);
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [result] = await db
      .insert(appointments)
      .values({
        ...appointment,
        customerPhone: appointment.customerPhone && appointment.customerPhone !== "" ? appointment.customerPhone : null,
        customerEmail: appointment.customerEmail && appointment.customerEmail !== "" ? appointment.customerEmail : null,
        assignedTo: appointment.assignedTo && appointment.assignedTo !== "" ? appointment.assignedTo : null,
        notes: appointment.notes && appointment.notes !== "" ? appointment.notes : null,
      })
      .returning();
    return result;
  }

  async getAllAppointments(): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .orderBy(desc(appointments.appointmentDate));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async updateAppointment(id: string, data: UpdateAppointment): Promise<Appointment | undefined> {
    const updateData: Partial<typeof appointments.$inferInsert> = {};
    
    if (data.appointmentDate !== undefined) updateData.appointmentDate = data.appointmentDate;
    if (data.appointmentTime !== undefined) updateData.appointmentTime = data.appointmentTime;
    if (data.customer !== undefined) updateData.customer = data.customer;
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone && data.customerPhone !== "" ? data.customerPhone : null;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail && data.customerEmail !== "" ? data.customerEmail : null;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo && data.assignedTo !== "" ? data.assignedTo : null;
    if (data.serviceType !== undefined) updateData.serviceType = data.serviceType;
    if (data.notes !== undefined) updateData.notes = data.notes && data.notes !== "" ? data.notes : null;
    if (data.status !== undefined) updateData.status = data.status;

    const [appointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async deleteAppointment(id: string): Promise<void> {
    await db
      .delete(appointments)
      .where(eq(appointments.id, id));
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.assignedTo, userId))
      .orderBy(desc(appointments.appointmentDate));
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    return await db
      .select()
      .from(appointments)
      .where(eq(appointments.appointmentDate, date))
      .orderBy(appointments.appointmentTime);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values(message)
      .returning();
    return result;
  }

  async getMessagesByHeadquarters(headquarters: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.channelType, "headquarters"),
        eq(messages.headquarters, headquarters as any)
      ))
      .orderBy(messages.createdAt);
  }

  async getMessagesByDepartment(department: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.channelType, "department"),
        eq(messages.department, department as any)
      ))
      .orderBy(messages.createdAt);
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    // Prevent self-conversations at storage level
    if (conversation.participant1 === conversation.participant2) {
      throw new Error("Cannot create conversation with yourself");
    }

    // Normalize participant order for uniqueness check
    const [p1, p2] = conversation.participant1 < conversation.participant2 
      ? [conversation.participant1, conversation.participant2]
      : [conversation.participant2, conversation.participant1];

    // Check for existing conversation
    const existing = await this.getConversation(p1, p2);
    if (existing) {
      return existing;
    }

    const [result] = await db
      .insert(conversations)
      .values({ ...conversation, participant1: p1, participant2: p2 })
      .returning();
    return result;
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(sql`${conversations.participant1} = ${userId} OR ${conversations.participant2} = ${userId}`)
      .orderBy(desc(conversations.lastMessageAt));
  }

  async getConversation(participant1: string, participant2: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(sql`
        (${conversations.participant1} = ${participant1} AND ${conversations.participant2} = ${participant2})
        OR
        (${conversations.participant1} = ${participant2} AND ${conversations.participant2} = ${participant1})
      `);
    return conversation || undefined;
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    // Normalize order for consistency
    const [p1, p2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    // Try to get existing conversation
    const existing = await this.getConversation(p1, p2);
    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.createConversation({ participant1: p1, participant2: p2 });
  }

  async createCustomer(customer: InsertCustomer & { createdBy: string }): Promise<Customer> {
    const [result] = await db
      .insert(customers)
      .values({
        ...customer,
        phone: customer.phone && customer.phone !== "" ? customer.phone : null,
        email: customer.email && customer.email !== "" ? customer.email : null,
        address: customer.address && customer.address !== "" ? customer.address : null,
      })
      .returning();
    return result;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer || undefined;
  }

  async updateUserProfilePicture(userId: string, profilePicture: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ profilePicture })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }
}

export const storage = new DatabaseStorage();
