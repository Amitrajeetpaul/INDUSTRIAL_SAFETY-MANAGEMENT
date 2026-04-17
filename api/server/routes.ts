import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword } from "./auth.js";
import { storage } from "./storage.js";
import { db, hasDb } from "./db.js";
import { api, environmentalMetrics, ppeInventory, safetyMeasures, trainingCertifications, sustainabilityMetrics } from "../../shared/schema.js";
import { z } from "zod";
import { sendCriticalIncidentAlert } from "./email.js";
import { eq, desc, count } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- Health Check (Immediate) ---
  app.get(['/api/health', '/health'], (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // --- Simulation Helpers ---
  async function runEnvironmentalSimulation() {
    try {
      const metricsList = await storage.getEnvironmentalMetrics();
      for (const m of metricsList) {
        let newValue = parseFloat(m.value);
        const fluctuation = (Math.random() - 0.5) * 2;
        newValue += fluctuation;

        if (m.type === 'air' && m.label === 'PM2.5') newValue = Math.max(5, Math.min(35, newValue));
        if (m.type === 'air' && m.label === 'CO2') newValue = Math.max(380, Math.min(500, newValue));
        if (m.type === 'water' && m.label === 'pH Level') newValue = Math.max(6.5, Math.min(8.5, newValue));
        if (m.type === 'machine' && m.label === 'Temp') newValue = Math.max(70, Math.min(95, newValue));

        await storage.updateEnvironmentalMetric(
          m.id,
          newValue.toFixed(m.type === 'air' ? 0 : 1),
          newValue > 90 || (m.type === 'water' && (newValue < 6.8 || newValue > 8.2)) ? 'warning' : 'optimal'
        );
      }
    } catch (e) {
      console.error("Simulation error:", e);
    }
  }

  async function runEnergySimulation() {
    try {
      const areas = ["Main Plant", "Assembly Line 1", "Assembly Line 2", "Warehouse"];
      for (const area of areas) {
        const consumption = (150 + Math.random() * 50).toFixed(1);
        const carbon = (parseFloat(consumption) * 0.4).toFixed(1);
        await storage.createSustainabilityMetric({
          area,
          consumption,
          carbonFootprint: carbon,
          unit: "kWh"
        });
      }
    } catch (e) {
      console.error("Energy simulation error:", e);
    }
  }

  // Initialize Auth
  setupAuth(app);

  // --- Incidents ---
  app.get(api.incidents.list.path, async (req, res) => {
    // Optional: filter by user role (workers might only see their own?)
    // For now, allow all authenticated users to see all (transparency)
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const incidents = await storage.getIncidents();
    res.json(incidents);
  });

  app.post(api.incidents.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.incidents.create.input.parse(req.body);
      const user = req.user as any;
      const incident = await storage.createIncident({
        ...input,
        reportedBy: user.id
      });

      if (incident.severity === 'critical' || incident.severity === 'high') {
        sendCriticalIncidentAlert(incident.title, user.name).catch(console.error);
      }

      res.status(201).json(incident);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.incidents.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const incident = await storage.getIncident(Number(req.params.id));
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
  });

  app.patch(api.incidents.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    // Only admins/managers can update status
    if (user.role === 'worker') return res.sendStatus(403);

    try {
      const { status } = api.incidents.update.input.parse(req.body);
      const updated = await storage.updateIncidentStatus(Number(req.params.id), status);
      if (!updated) return res.status(404).json({ message: "Incident not found" });
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Risks ---
  app.get(api.risks.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const risks = await storage.getRisks();
    res.json(risks);
  });

  app.post(api.risks.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Workers might not be allowed to define formal risks, but for now let's allow it or restrict to manager+
    // if (req.user.role === 'worker') return res.sendStatus(403);

    try {
      const input = api.risks.create.input.parse(req.body);
      const risk = await storage.createRisk(input);
      res.status(201).json(risk);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Messages ---
  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.messages.create.input.parse(req.body);
      const user = req.user as any;
      const message = await storage.createMessage({
        ...input,
        userId: user.id
      });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Stats ---
  app.get(api.stats.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Trigger simulation tick on dashboard view
    await runEnvironmentalSimulation();
    const stats = await storage.getStats();
    res.json(stats);
  });

  // --- AI Chat ---
  app.post('/api/ai/chat', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ reply: 'Invalid message' });
    }

    const lower = message.toLowerCase();
    let reply = "I am the InduSafe AI Assistant. I can help with safety protocols, emergency procedures, and hazard identification. How can I assist you today?";

    if (lower.includes('fire') || lower.includes('smoke')) {
      reply = "FIRE PROTOCOL: \n1. Activate the nearest fire alarm.\n2. Evacuate the building using designated fire exits.\n3. Do NOT use elevators.\n4. Call emergency services immediately.\n5. Assemble at your designated safe zone.";
    } else if (lower.includes('spill') || lower.includes('chemical')) {
      reply = "CHEMICAL SPILL PROTOCOL: \n1. Clear the immediate area.\n2. Ensure adequate ventilation if safe to do so.\n3. Identify the chemical using the SDS (Safety Data Sheet) if known.\n4. Wear proper PPE before attempting any cleanup.\n5. If the spill is large or hazardous, contact the Hazmat team.";
    } else if (lower.includes('injury') || lower.includes('hurt') || lower.includes('cut')) {
      reply = "MEDICAL EMERGENCY: \n1. Do not move the injured person unless they are in immediate danger.\n2. Call for medical assistance immediately.\n3. If you are trained, apply basic first aid (e.g., stop bleeding with pressure).\n4. Wait with the person until help arrives.";
    } else if (lower.includes('report') || lower.includes('incident')) {
      reply = "To report an incident, click on the 'Report Hazard' button in the navigation menu. Be sure to provide the exact location, a detailed description, and upload a photo if possible.";
    }

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    res.json({ reply });
  });

  // --- PPE ---
  app.get(api.ppe.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const items = await storage.getPPEItems();
    res.json(items);
  });

  app.patch(api.ppe.updateStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { status } = api.ppe.updateStatus.input.parse(req.body);
    const updated = await storage.updatePPEStatus(Number(req.params.id), status);
    if (!updated) return res.status(404).json({ message: "PPE not found" });
    res.json(updated);
  });

  // --- Metrics ---
  app.get(api.metrics.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await runEnvironmentalSimulation();
    const metrics = await storage.getEnvironmentalMetrics();
    res.json(metrics);
  });

  // --- Safety Measures ---
  app.get(api.safetyMeasures.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const measures = await storage.getSafetyMeasures();
    res.json(measures);
  });

  app.post(api.safetyMeasures.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.safetyMeasures.create.input.parse(req.body);
      const measure = await storage.createSafetyMeasure(input);
      res.status(201).json(measure);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Training ---
  app.get(api.training.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const certs = await storage.getTrainingCertifications();
    res.json(certs);
  });

  // --- Sustainability ---
  app.get(api.sustainability.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await runEnergySimulation();
    const metrics = await storage.getSustainabilityMetrics();
    // Sort and limit to recent 100 for better performance
    const sorted = [...metrics].sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    res.json(sorted.slice(0, 100));
  });

  // --- PDF Export (Real) ---
  app.get('/api/incidents/:id/pdf', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const incident = await storage.getIncident(Number(req.params.id));
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Professional Header
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("INDUSAFE SAFETY REPORT", 20, 25);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 25);
      
      // Incident Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text("Incident Information", 20, 60);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 65, 190, 65);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Title:", 20, 80);
      doc.setFont("helvetica", "normal");
      doc.text(String(incident.title), 60, 80);
      
      doc.setFont("helvetica", "bold");
      doc.text("Location:", 20, 95);
      doc.setFont("helvetica", "normal");
      doc.text(String(incident.location), 60, 95);
      
      doc.setFont("helvetica", "bold");
      doc.text("Severity:", 20, 110);
      doc.setFont("helvetica", "normal");
      doc.text(String(incident.severity).toUpperCase(), 60, 110);
      
      doc.setFont("helvetica", "bold");
      doc.text("Status:", 20, 125);
      doc.setFont("helvetica", "normal");
      doc.text(String(incident.status).replace('_', ' ').toUpperCase(), 60, 125);
      
      doc.setFont("helvetica", "bold");
      doc.text("Reported At:", 20, 140);
      doc.setFont("helvetica", "normal");
      doc.text(incident.createdAt ? new Date(incident.createdAt).toLocaleDateString() : 'N/A', 60, 140);
      
      // Description / Footer
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Safety Analysis", 20, 160);
      doc.line(20, 165, 190, 165);
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize("This incident was automatically logged by the InduSafe Industrial Control System. Standard operating procedures require immediate review of this sector and environmental checks to prevent recurrence.", 170);
      doc.text(splitText, 20, 175);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("InduSafe Enterprise Safety Management System | Confidential Report", 105, 280, { align: "center" });

      const pdfOutput = doc.output('arraybuffer');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Incident_Report_${incident.id}.pdf`);
      res.send(Buffer.from(pdfOutput));

    } catch (error) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  });

  // --- Seed Data ---
  await seedData();

  // --- Live Data Simulation ---
  if (process.env.NODE_ENV !== "production") {
    setInterval(runEnvironmentalSimulation, 5000);
    setInterval(runEnergySimulation, 10000);
  }

  return httpServer;
}

async function seedData() {
  const hashedPassword = await hashPassword("password123");

  const existingAdmin = await storage.getUserByUsername("admin");
  if (!existingAdmin) {
    // Create default users
    const adminUser = await storage.createUser({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      name: "System Admin"
    });

    await storage.createUser({
      username: "manager",
      password: hashedPassword,
      role: "manager",
      name: "Safety Manager"
    });

    await storage.createUser({
      username: "worker",
      password: hashedPassword,
      role: "worker",
      name: "John Doe"
    });

    // Seed Incidents
    await storage.createIncident({
      title: "Chemical Spill in Zone B",
      description: "Small leakage of cleaning solvent observed near storage unit 4.",
      location: "Warehouse Zone B",
      severity: "medium",
      imageUrl: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop",
      reportedBy: adminUser.id
    });

    await storage.createIncident({
      title: "Broken Safety Rail",
      description: "Guard rail on 2nd floor walkway is loose.",
      location: "Production Line 2",
      severity: "high",
      imageUrl: "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800&auto=format&fit=crop",
      reportedBy: adminUser.id
    });

    // Seed Risks
    await storage.createRisk({
      hazard: "Forklift Traffic",
      description: "High traffic intersection near loading dock.",
      riskLevel: "high",
      mitigation: "Install mirrors and warning lights."
    });

    // Seed Metrics
    const metrics = [
      { type: 'air', label: 'PM2.5', value: '12', unit: 'µg/m³', status: 'optimal' },
      { type: 'air', label: 'CO2', value: '415', unit: 'ppm', status: 'optimal' },
      { type: 'water', label: 'pH Level', value: '7.2', unit: 'pH', status: 'optimal' },
      { type: 'water', label: 'Turbidity', value: '0.8', unit: 'NTU', status: 'optimal' },
      { type: 'machine', label: 'Conveyor Temp', value: '42', unit: '°C', status: 'warning' },
      { type: 'machine', label: 'Vibration', value: '2.1', unit: 'mm/s', status: 'optimal' },
    ];
    for (const m of metrics) await storage.createEnvironmentalMetric(m as any);

    // Seed PPE
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const ppeItems = [
      { name: 'Hard Hat Elite', type: 'Hard Hat', serialNumber: 'HH-001', manufactureDate: threeMonthsAgo, lastInspectionDate: threeMonthsAgo, nextInspectionDate: sixMonthsLater, status: 'ok' },
      { name: 'Safety Harness X', type: 'Harness', serialNumber: 'SH-042', manufactureDate: threeMonthsAgo, lastInspectionDate: threeMonthsAgo, nextInspectionDate: nextWeek, status: 'maintenance_due' },
      { name: 'Pro Boots 2.0', type: 'Boots', serialNumber: 'BT-999', manufactureDate: threeMonthsAgo, lastInspectionDate: threeMonthsAgo, nextInspectionDate: sixMonthsLater, status: 'ok' },
    ];
    for (const p of ppeItems) await storage.createPPEItem(p as any);

    // Seed Safety Measures
    const safety = [
      { description: 'Improper ventilation in chemical storage', actionTaken: 'Installed industrial-grade extractor fans and upgraded sensors.', status: 'completed', completedAt: now },
      { description: 'Slippery stairs near entrance', actionTaken: 'Applied non-slip adhesive strips and added a secondary handrail.', status: 'completed', completedAt: now },
    ];
    for (const s of safety) await storage.createSafetyMeasure(s as any);

    // Seed Training
    const threeMonthsLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const twoWeeksAway = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const training = [
      { workerName: 'John Doe', courseName: 'Forklift Safety', issueDate: lastMonth, expiryDate: threeMonthsLater, status: 'valid' },
      { workerName: 'Alice Smith', courseName: 'Hazmat Response', issueDate: lastMonth, expiryDate: twoWeeksAway, status: 'expiring_soon' },
      { workerName: 'Bob Wilson', courseName: 'Confined Space Entry', issueDate: new Date(2023, 1, 1), expiryDate: lastMonth, status: 'expired' },
    ];
    for (const t of training) await storage.createTrainingCertification(t as any);

    // Seed Sustainability (24-hour history for graphs)
    const areas = ["Main Plant", "Assembly Line 1", "Assembly Line 2", "Warehouse"];
    for (const area of areas) {
      for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);
        const baseConsumption = area === "Main Plant" ? 180 : area === "Warehouse" ? 50 : 120;
        const consumption = (baseConsumption + Math.random() * 20).toFixed(1);
        const carbon = (parseFloat(consumption) * 0.4).toFixed(1);
        await storage.createSustainabilityMetric({
          area,
          consumption,
          carbonFootprint: carbon,
          unit: "kWh",
          createdAt: timestamp
        } as any);
      }
    }

  } else if (hasDb && existingAdmin) {
    // Update existing users with hashed password if needed (lite mode hack)
    if (!existingAdmin.password.includes('.')) {
      await storage.updateUser(existingAdmin.id, { password: hashedPassword });

      const manager = await storage.getUserByUsername("manager");
      if (manager && !manager.password.includes('.')) {
        await storage.updateUser(manager.id, { password: hashedPassword });
      }

      const worker = await storage.getUserByUsername("worker");
      if (worker && !worker.password.includes('.')) {
        await storage.updateUser(worker.id, { password: hashedPassword });
      }
    }
  }
}
