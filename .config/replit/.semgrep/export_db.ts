import { db } from "./server/db";
import { users, timePunches, workOrders, parts } from "@shared/schema";
import * as fs from "fs";

async function exportDatabase() {
  try {
    const [userRows, punchRows, woRows, partRows] = await Promise.all([
      db.select().from(users),
      db.select().from(timePunches),
      db.select().from(workOrders),
      db.select().from(parts),
    ]);

    const allData = {
      users: userRows,
      timePunches: punchRows,
      workOrders: woRows,
      parts: partRows,
    };

    fs.writeFileSync("database_export.json", JSON.stringify(allData, null, 2));
    
    let csv = "";
    for (const [table, data] of Object.entries(allData)) {
      csv += `\n\n=== TABLE: ${table} ===\n`;
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        csv += keys.join(",") + "\n";
        for (const row of data) {
          csv += keys.map(k => {
            let v = row[k];
            if (v === null || v === undefined) return "";
            v = String(v).replace(/"/g, '""');
            return v.includes(",") || v.includes('"') ? `"${v}"` : v;
          }).join(",") + "\n";
        }
      }
    }
    fs.writeFileSync("database_export.csv", csv);
    
    console.log("✅ Export complete!");
    console.log("Files created: database_export.json, database_export.csv");
  } catch (e) {
    console.error("Export failed:", e);
  }
  process.exit(0);
}

exportDatabase();
