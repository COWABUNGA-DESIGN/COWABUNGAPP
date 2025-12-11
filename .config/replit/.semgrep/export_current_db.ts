
import { db } from "./server/db";
import { users, timePunches, workOrders, workOrderTasks, parts, machines, appointments, customers, conversations, messages, notifications } from "@shared/schema";
import * as fs from "fs";

async function exportAllData() {
  try {
    console.log("Starting database export...");
    
    const [
      userRows,
      punchRows,
      woRows,
      taskRows,
      partRows,
      machineRows,
      appointmentRows,
      customerRows,
      conversationRows,
      messageRows,
      notificationRows
    ] = await Promise.all([
      db.select().from(users),
      db.select().from(timePunches),
      db.select().from(workOrders),
      db.select().from(workOrderTasks),
      db.select().from(parts),
      db.select().from(machines),
      db.select().from(appointments),
      db.select().from(customers),
      db.select().from(conversations),
      db.select().from(messages),
      db.select().from(notifications),
    ]);

    const allData = {
      users: userRows,
      timePunches: punchRows,
      workOrders: woRows,
      workOrderTasks: taskRows,
      parts: partRows,
      machines: machineRows,
      appointments: appointmentRows,
      customers: customerRows,
      conversations: conversationRows,
      messages: messageRows,
      notifications: notificationRows,
      exportDate: new Date().toISOString(),
    };

    // Save as JSON
    fs.writeFileSync("database_backup.json", JSON.stringify(allData, null, 2));
    console.log("✅ JSON backup created: database_backup.json");

    // Create CSV export for each table
    let csvContent = "";
    for (const [table, data] of Object.entries(allData)) {
      if (table === 'exportDate') continue;
      csvContent += `\n\n=== TABLE: ${table} ===\n`;
      if (Array.isArray(data) && data.length > 0) {
        const keys = Object.keys(data[0]);
        csvContent += keys.join(",") + "\n";
        for (const row of data) {
          csvContent += keys.map(k => {
            let v = row[k as keyof typeof row];
            if (v === null || v === undefined) return "";
            v = String(v).replace(/"/g, '""').replace(/\n/g, ' ');
            return v.includes(",") || v.includes('"') ? `"${v}"` : v;
          }).join(",") + "\n";
        }
      }
    }
    fs.writeFileSync("database_backup.csv", csvContent);
    console.log("✅ CSV backup created: database_backup.csv");

    // Print summary
    console.log("\n📊 Export Summary:");
    console.log(`  - Users: ${userRows.length}`);
    console.log(`  - Time Punches: ${punchRows.length}`);
    console.log(`  - Work Orders: ${woRows.length}`);
    console.log(`  - Tasks: ${taskRows.length}`);
    console.log(`  - Parts: ${partRows.length}`);
    console.log(`  - Machines: ${machineRows.length}`);
    console.log(`  - Appointments: ${appointmentRows.length}`);
    console.log(`  - Customers: ${customerRows.length}`);
    console.log(`  - Conversations: ${conversationRows.length}`);
    console.log(`  - Messages: ${messageRows.length}`);
    console.log(`  - Notifications: ${notificationRows.length}`);
    
  } catch (e) {
    console.error("❌ Export failed:", e);
  }
  process.exit(0);
}

exportAllData();
