import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, date, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  employeeId: text("employee_id").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "technician", "technical_advisor"] }).notNull().default("technician"),
  email: text("email"),
  department: text("department", { enum: ["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"] }),
  occupation: text("occupation"),
  headquarters: text("headquarters", { enum: ["Montreal, QC", "Quebec, QC", "Saguenay, QC"] }),
  profilePicture: text("profile_picture"),
  bannerImage: text("banner_image"),
  mood: text("mood", { enum: ["happy", "focused", "tired", "stressed", "neutral"] }).default("neutral"),
  isActive: text("is_active").notNull().default("true"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderNumber: text("work_order_number").notNull().unique(),
  title: text("title").notNull(),
  priority: text("priority", { enum: ["Normal", "High", "Urgent"] }).notNull().default("Normal"),
  department: text("department", { enum: ["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"] }).notNull(),
  headquarters: text("headquarters", { enum: ["Montreal, QC", "Quebec, QC", "Saguenay, QC"] }).notNull(),
  customer: text("customer").notNull(),
  siteAddress: text("site_address").notNull(),
  asset: text("asset").notNull(),
  problemSummary: text("problem_summary").notNull(),
  status: text("status", { enum: ["new", "demand", "assigned", "in-progress", "completed", "closedForReview"] }).notNull().default("new"),
  notes: text("notes"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  demandedBy: varchar("demanded_by").references(() => users.id),
  photos: text("photos").array(),
  actualHours: real("actual_hours").default(0),
  efficiency: real("efficiency"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

export const workOrderTasks = pgTable("work_order_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  budgetedHours: real("budgeted_hours").notNull(),
  sortOrder: real("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const machines = pgTable("machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  category: text("category", { enum: ["Lift", "Hoist", "Platform", "Stairs", "Ramp", "Other"] }).notNull(),
  status: text("status", { enum: ["active", "maintenance", "retired", "in-stock"] }).notNull().default("in-stock"),
  location: text("location"),
  lastServiceDate: date("last_service_date"),
  nextServiceDate: date("next_service_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const parts = pgTable("parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partNumber: text("part_number").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category", { enum: ["Motor", "Gear", "Bearing", "Hydraulic", "Electrical", "Fastener", "Other"] }).notNull(),
  quantity: integer("quantity").notNull().default(0),
  unitCost: real("unit_cost"),
  supplier: text("supplier"),
  location: text("location"),
  reorderLevel: integer("reorder_level").default(5),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const timePunches = pgTable("time_punches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  taskId: varchar("task_id").references(() => workOrderTasks.id, { onDelete: "cascade" }),
  punchType: text("punch_type", { enum: ["work", "travel", "other"] }).notNull().default("work"),
  clockIn: timestamp("clock_in").notNull(),
  clockOut: timestamp("clock_out"),
  kilometers: real("kilometers"),
  punchDate: date("punch_date").notNull(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["work_order_assigned", "work_order_demand", "work_order_completed"] }).notNull(),
  message: text("message").notNull(),
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  isRead: text("is_read").notNull().default("false"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: text("appointment_time").notNull(),
  customer: text("customer").notNull(),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  serviceType: text("service_type", { enum: ["Maintenance", "Repair", "Inspection", "Consultation", "Delivery", "Pickup"] }).notNull(),
  notes: text("notes"),
  status: text("status", { enum: ["scheduled", "confirmed", "in-progress", "completed", "cancelled"] }).notNull().default("scheduled"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1: varchar("participant1").notNull().references(() => users.id),
  participant2: varchar("participant2").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  lastMessageAt: timestamp("last_message_at").default(sql`now()`),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  channelType: text("channel_type", { enum: ["headquarters", "department", "direct"] }).notNull(),
  headquarters: text("headquarters", { enum: ["Montreal, QC", "Quebec, QC", "Saguenay, QC"] }),
  department: text("department", { enum: ["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"] }),
  conversationId: varchar("conversation_id").references(() => conversations.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  isActive: true,
  profilePicture: true,
  bannerImage: true,
  mood: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().min(1, "Employee ID is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  department: z.enum(["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"]).optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  headquarters: z.enum(["Montreal, QC", "Quebec, QC", "Saguenay, QC"]).optional().or(z.literal("")),
  role: z.enum(["admin", "technician", "technical_advisor"]).default("technician"),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  department: z.enum(["Road Technician", "Garage Technician", "Sales", "Tech Advisor", "Accounting", "HR"]).optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  headquarters: z.enum(["Montreal, QC", "Quebec, QC", "Saguenay, QC"]).optional().or(z.literal("")),
  role: z.enum(["admin", "technician", "technical_advisor"]).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  profilePicture: z.string().optional().or(z.literal("")),
  bannerImage: z.string().optional().or(z.literal("")),
  mood: z.enum(["happy", "focused", "tired", "stressed", "neutral"]).optional(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  workOrderNumber: true,
  actualHours: true,
  efficiency: true,
  createdAt: true,
  completedAt: true,
}).extend({
  tasks: z.array(z.object({
    title: z.string().min(1, "Task title is required"),
    description: z.string().optional(),
    budgetedHours: z.number().min(0.5, "Budgeted hours must be at least 0.5").max(99, "Budgeted hours cannot exceed 99"),
  })).min(1, "At least one task is required"),
  photos: z.array(z.string()).optional(),
});

export const insertTaskSchema = createInsertSchema(workOrderTasks).omit({
  id: true,
  createdAt: true,
});

export const insertMachineSchema = createInsertSchema(machines).omit({
  id: true,
  createdAt: true,
});

export const insertPartSchema = createInsertSchema(parts).omit({
  id: true,
  createdAt: true,
});

export const insertTimePunchSchema = createInsertSchema(timePunches).omit({
  id: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
}).extend({
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  customer: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional().or(z.literal("")),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  serviceType: z.enum(["Maintenance", "Repair", "Inspection", "Consultation", "Delivery", "Pickup"]),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["scheduled", "confirmed", "in-progress", "completed", "cancelled"]).default("scheduled"),
});

export const updateAppointmentSchema = z.object({
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  customer: z.string().optional(),
  customerPhone: z.string().optional().or(z.literal("")),
  customerEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  assignedTo: z.string().optional().or(z.literal("")),
  serviceType: z.enum(["Maintenance", "Repair", "Inspection", "Consultation", "Delivery", "Pickup"]).optional(),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["scheduled", "confirmed", "in-progress", "completed", "cancelled"]).optional(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdBy: true,
  createdAt: true,
}).extend({
  name: z.string().min(1, "Customer name is required"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type WorkOrder = typeof workOrders.$inferSelect;
export type WorkOrderTask = typeof workOrderTasks.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type Part = typeof parts.$inferSelect;
export type TimePunch = typeof timePunches.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMachine = z.infer<typeof insertMachineSchema>;
export type InsertPart = z.infer<typeof insertPartSchema>;
export type InsertTimePunch = z.infer<typeof insertTimePunchSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
