import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users as usersTable } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedAdminUser() {
  try {
    const users = [
      {
        username: "seub",
        employeeId: "EMP001",
        password: "1",
        role: "admin" as const,
        email: "",
        headquarters: "Montreal, QC" as const,
      },
      {
        username: "nadia",
        employeeId: "EMP002",
        password: "1",
        role: "technical_advisor" as const,
        email: "sebastien.germain1989@gmail.com",
        headquarters: "Montreal, QC" as const,
      },
      {
        username: "steve",
        employeeId: "EMP003",
        password: "vex",
        role: "technical_advisor" as const,
        email: "",
        headquarters: "Montreal, QC" as const,
      },
      {
        username: "bruno",
        employeeId: "EMP004",
        password: "vex",
        role: "technical_advisor" as const,
        email: "",
        headquarters: "Montreal, QC" as const,
      },
      {
        username: "john",
        employeeId: "EMP005",
        password: "vex",
        role: "technical_advisor" as const,
        email: "",
        headquarters: "Montreal, QC" as const,
      },
      {
        username: "phil",
        employeeId: "EMP006",
        password: "vex",
        role: "technical_advisor" as const,
        email: "",
        headquarters: "Montreal, QC" as const,
      },
      {
        username: "cody",
        employeeId: "EMP007",
        password: "1",
        role: "technician" as const,
        email: "",
        department: "Road Technician" as const,
        headquarters: "Montreal, QC" as const,
      },
    ];

    for (const userData of users) {
      const existingUser = await storage.getUserByUsername(userData.username);
      if (!existingUser) {
        await storage.createUser(userData);
        console.log(`✓ User '${userData.username}' (${userData.role}) created successfully`);
      } else {
        const needsUpdate = 
          existingUser.role !== userData.role ||
          existingUser.headquarters !== userData.headquarters ||
          existingUser.department !== userData.department;
        
        if (needsUpdate) {
          await storage.updateUser(existingUser.id, { 
            role: userData.role,
            headquarters: userData.headquarters,
            department: userData.department 
          });
          console.log(`✓ User '${userData.username}' updated: role=${userData.role}, dept=${userData.department}, HQ=${userData.headquarters}`);
        }
        
        const passwordHash = await bcrypt.hash(userData.password, 10);
        await db
          .update(usersTable)
          .set({ passwordHash })
          .where(eq(usersTable.id, existingUser.id));
        console.log(`✓ User '${userData.username}' password updated`);
      }
    }
  } catch (error) {
    console.error("Failed to seed users:", error);
  }
}
