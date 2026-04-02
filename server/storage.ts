import { db } from "./db";
import {
  users, incidents, risks, messages, 
  ppeInventory, environmentalMetrics, safetyMeasures,
  trainingCertifications, sustainabilityMetrics,
  type User, type InsertUser,
  type Incident, type InsertIncident,
  type Risk, type InsertRisk,
  type Message, type InsertMessage,
  type PPEItem, type InsertPPE,
  type Metric, type InsertMetric,
  type SafetyMeasure, type InsertSafetyMeasure,
  type TrainingCertification, type InsertTraining,
  type SustainabilityMetric, type InsertSustainability
} from "@shared/schema";
import { eq, desc, count, sql, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  getIncident(id: number): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident & { reportedBy: number }): Promise<Incident>;
  updateIncidentStatus(id: number, status: "open" | "under_review" | "resolved"): Promise<Incident | undefined>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Risks
  getRisks(): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;

  // Stats
  getStats(): Promise<{
    totalIncidents: number;
    activeCases: number;
    riskScore: number;
    resolvedCount: number;
  }>;

  // Messages
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage & { userId: number }): Promise<Message>;

  // PPE
  getPPEItems(): Promise<PPEItem[]>;
  updatePPEStatus(id: number, status: string): Promise<PPEItem | undefined>;

  // Metrics
  getEnvironmentalMetrics(): Promise<Metric[]>;
  createEnvironmentalMetric(metric: Partial<Metric>): Promise<Metric>;
  updateEnvironmentalMetric(id: number, value: string, status: string): Promise<Metric | undefined>;

  // Training
  getTrainingCertifications(): Promise<TrainingCertification[]>;
  createTrainingCertification(cert: InsertTraining): Promise<TrainingCertification>;

  // Sustainability
  getSustainabilityMetrics(): Promise<SustainabilityMetric[]>;
  createSustainabilityMetric(metric: InsertSustainability): Promise<SustainabilityMetric>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`lower(${users.username}) = lower(${username})`);
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getIncidents(): Promise<Incident[]> {
    return await db.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(incident: InsertIncident & { reportedBy: number }): Promise<Incident> {
    const [newIncident] = await db.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncidentStatus(id: number, status: "open" | "under_review" | "resolved"): Promise<Incident | undefined> {
    const [updated] = await db.update(incidents)
      .set({ status })
      .where(eq(incidents.id, id))
      .returning();
    return updated;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async getRisks(): Promise<Risk[]> {
    return await db.select().from(risks).orderBy(desc(risks.createdAt));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [newRisk] = await db.insert(risks).values(risk).returning();
    return newRisk;
  }

  async getStats() {
    const allIncidents = await db.select().from(incidents);
    const totalIncidents = allIncidents.length;
    const activeCases = allIncidents.filter(i => i.status !== 'resolved').length;
    const resolvedCount = allIncidents.filter(i => i.status === 'resolved').length;
    const riskScore = Math.min(100, activeCases * 10 + allIncidents.filter(i => i.severity === 'critical').length * 20);

    return { totalIncidents, activeCases, riskScore, resolvedCount };
  }

  async getMessages(): Promise<Message[]> {
    const allMessages = await db.select().from(messages).orderBy(desc(messages.createdAt)).limit(50);
    return allMessages.reverse();
  }

  async createMessage(message: InsertMessage & { userId: number }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // PPE
  async getPPEItems(): Promise<PPEItem[]> {
    return await db.select().from(ppeInventory).orderBy(desc(ppeInventory.createdAt));
  }

  async updatePPEStatus(id: number, status: string): Promise<PPEItem | undefined> {
    const [updated] = await db.update(ppeInventory).set({ status }).where(eq(ppeInventory.id, id)).returning();
    return updated;
  }

  // Metrics
  async getEnvironmentalMetrics(): Promise<Metric[]> {
    return await db.select().from(environmentalMetrics).orderBy(asc(environmentalMetrics.id));
  }

  async createEnvironmentalMetric(metric: Partial<Metric>): Promise<Metric> {
    const [newMetric] = await db.insert(environmentalMetrics).values(metric as any).returning();
    return newMetric;
  }

  async updateEnvironmentalMetric(id: number, value: string, status: string): Promise<Metric | undefined> {
    const [updated] = await db.update(environmentalMetrics).set({ value, status }).where(eq(environmentalMetrics.id, id)).returning();
    return updated;
  }

  // Safety Measures
  async getSafetyMeasures(): Promise<SafetyMeasure[]> {
    return await db.select().from(safetyMeasures).orderBy(desc(safetyMeasures.createdAt));
  }

  async createSafetyMeasure(measure: InsertSafetyMeasure): Promise<SafetyMeasure> {
    const [newMeasure] = await db.insert(safetyMeasures).values(measure).returning();
    return newMeasure;
  }

  // Training
  async getTrainingCertifications(): Promise<TrainingCertification[]> {
    return await db.select().from(trainingCertifications).orderBy(desc(trainingCertifications.expiryDate));
  }

  async createTrainingCertification(cert: InsertTraining): Promise<TrainingCertification> {
    const [newCert] = await db.insert(trainingCertifications).values(cert).returning();
    return newCert;
  }

  // Sustainability
  async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> {
    return await db.select().from(sustainabilityMetrics).orderBy(desc(sustainabilityMetrics.createdAt));
  }

  async createSustainabilityMetric(metric: InsertSustainability): Promise<SustainabilityMetric> {
    const [newMetric] = await db.insert(sustainabilityMetrics).values(metric).returning();
    return newMetric;
  }
}

export const storage = new DatabaseStorage();
