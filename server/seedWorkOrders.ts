import { storage } from "./storage";
import type { User } from "@shared/schema";

export async function seedWorkOrders() {
  try {
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      console.log("No users found - skipping work order seeding");
      return;
    }

    const existingWorkOrders = await storage.getAllWorkOrders();
    if (existingWorkOrders.length > 0) {
      console.log("Work orders already exist - skipping seeding");
      return;
    }

    const seub = users.find((u) => u.username === "seub");
    const steve = users.find((u) => u.username === "steve");
    const cody = users.find((u) => u.username === "cody");
    const nadia = users.find((u) => u.username === "nadia");

    const creator = seub || users[0];

    const workOrders = [
      {
        title: "Hydraulic leak on forklift cylinder",
        priority: "High" as const,
        department: "Road Technician" as const,
        headquarters: "Montreal, QC" as const,
        customer: "Distribution Laval Inc.",
        siteAddress: "2450 Boul. Le Corbusier, Laval, QC H7S 2C9",
        asset: "Toyota 7FGU35 - Serial: 78234-A",
        problemSummary: "Customer reports hydraulic fluid dripping from lift cylinder. Unit still operational but losing pressure. Inspect cylinder seals and hydraulic lines. May need full cylinder rebuild.",
        tasks: [
          { title: "Diagnose hydraulic leak source", budgetedHours: 0.5 },
          { title: "Replace cylinder seals", budgetedHours: 2.0 },
          { title: "Pressure test and quality check", budgetedHours: 1.0 },
        ],
        createdBy: creator.id,
        assignedTo: steve?.id,
        status: steve ? "assigned" as const : "new" as const,
      },
      {
        title: "Lift chain binding on scissor lift",
        priority: "Urgent" as const,
        department: "Garage Technician" as const,
        headquarters: "Quebec, QC" as const,
        customer: "Quebec Warehouse Solutions",
        siteAddress: "8900 Boul. Henri-Bourassa, Quebec City, QC G1G 5X1",
        asset: "Genie GS-3232 - Serial: GS3232-19845",
        problemSummary: "Lift chain jamming at half extension. Makes grinding noise. Unit currently out of service for safety. Customer needs ASAP repair - critical for warehouse operations.",
        tasks: [
          { title: "Inspect lift chain and sprockets", budgetedHours: 1.0 },
          { title: "Disassemble and clean mechanism", budgetedHours: 1.5 },
          { title: "Replace worn chain links", budgetedHours: 1.0 },
          { title: "Test full range of motion", budgetedHours: 0.5 },
        ],
        createdBy: creator.id,
        assignedTo: cody?.id,
        status: cody ? "in-progress" as const : "new" as const,
        actualHours: cody ? 1.5 : 0,
      },
      {
        title: "Electrical fault code E47",
        priority: "Normal" as const,
        department: "Road Technician" as const,
        headquarters: "Montreal, QC" as const,
        customer: "Les Entreprises Fortin",
        siteAddress: "500 Rue Principale, Saint-Eustache, QC J7R 5B9",
        asset: "Crown RC5500 - Serial: RC-092847",
        problemSummary: "Error code E47 appearing intermittently on display. Unit operates but displays fault. Check wiring harness and controller connections. Might be sensor issue.",
        tasks: [
          { title: "Diagnostic scan and error code analysis", budgetedHours: 0.5 },
          { title: "Inspect wiring harness and connections", budgetedHours: 1.0 },
          { title: "Test and repair as needed", budgetedHours: 0.5 },
        ],
        createdBy: creator.id,
        assignedTo: nadia?.id,
        status: nadia ? "assigned" as const : "new" as const,
      },
      {
        title: "Annual preventive maintenance",
        priority: "Normal" as const,
        department: "Garage Technician" as const,
        headquarters: "Saguenay, QC" as const,
        customer: "Aluminerie de Saguenay",
        siteAddress: "3255 Boul. de la Grande-Baie S, La Baie, QC G7B 3N8",
        asset: "Komatsu FD40T - Serial: FD40-56712",
        problemSummary: "Scheduled 500-hour preventive maintenance. Full inspection, fluid changes, filter replacement, brake check, and load test as per manufacturer specifications.",
        tasks: [
          { title: "Complete visual inspection", budgetedHours: 0.5 },
          { title: "Change all fluids and filters", budgetedHours: 1.5 },
          { title: "Brake system inspection and adjustment", budgetedHours: 1.0 },
          { title: "Load test and documentation", budgetedHours: 2.0 },
        ],
        createdBy: creator.id,
        assignedTo: steve?.id,
        status: steve ? "completed" as const : "new" as const,
        actualHours: 4.2,
        efficiency: 119.0,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        title: "Brake system not holding pressure",
        priority: "Urgent" as const,
        department: "Road Technician" as const,
        headquarters: "Montreal, QC" as const,
        customer: "Montreal Logistics Hub",
        siteAddress: "12000 Rue Sherbrooke E, Montreal, QC H1B 1C1",
        asset: "Hyster H80FT - Serial: HY-80-23456",
        problemSummary: "Service brake not holding. Emergency brake functional. Unit taken out of service immediately. Suspected master cylinder failure or air in lines. Priority repair needed.",
        tasks: [
          { title: "Diagnose brake system issue", budgetedHours: 0.5 },
          { title: "Replace master cylinder if needed", budgetedHours: 1.5 },
          { title: "Bleed brake lines and pressure test", budgetedHours: 1.0 },
        ],
        createdBy: creator.id,
        status: "new" as const,
      },
      {
        title: "Load capacity recertification",
        priority: "Normal" as const,
        department: "Tech Advisor" as const,
        headquarters: "Quebec, QC" as const,
        customer: "Industrielle Alliance du Quebec",
        siteAddress: "1250 Boul. Charest O, Quebec City, QC G1N 2E4",
        asset: "Yale GDP080 - Serial: GDP-08-77123",
        problemSummary: "Annual load capacity certification required for insurance compliance. Perform full load test, inspect forks and carriage, verify nameplate data, issue certification documents.",
        tasks: [
          { title: "Inspect forks and carriage for wear", budgetedHours: 0.5 },
          { title: "Perform rated load test", budgetedHours: 1.5 },
          { title: "Complete certification paperwork", budgetedHours: 0.5 },
        ],
        createdBy: creator.id,
        assignedTo: nadia?.id,
        status: nadia ? "completed" as const : "new" as const,
        actualHours: 3.1,
        efficiency: 80.6,
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    for (const wo of workOrders) {
      await storage.createWorkOrder(wo);
    }

    console.log(`✅ Seeded ${workOrders.length} work orders`);
  } catch (error) {
    console.error("Failed to seed work orders:", error);
  }
}
