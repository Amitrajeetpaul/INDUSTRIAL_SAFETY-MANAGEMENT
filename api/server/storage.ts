import { db, hasDb } from "./db.js";
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
} from "../../shared/schema.js";
import { eq, desc, count, sql, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  getIncident(id: number): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident & { reportedBy: number }): Promise<Incident>;
  updateIncidentStatus(id: number, status: "open" | "under_review" | "resolved"): Promise<Incident | undefined>;

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
  createPPEItem(item: InsertPPE): Promise<PPEItem>;
  updatePPEStatus(id: number, status: string): Promise<PPEItem | undefined>;

  // Metrics
  getEnvironmentalMetrics(): Promise<Metric[]>;
  createEnvironmentalMetric(metric: Partial<Metric>): Promise<Metric>;
  updateEnvironmentalMetric(id: number, value: string, status: string): Promise<Metric | undefined>;

  // Safety Measures
  getSafetyMeasures(): Promise<SafetyMeasure[]>;
  createSafetyMeasure(measure: InsertSafetyMeasure): Promise<SafetyMeasure>;

  // Training
  getTrainingCertifications(): Promise<TrainingCertification[]>;
  createTrainingCertification(cert: InsertTraining): Promise<TrainingCertification>;

  // Sustainability
  getSustainabilityMetrics(): Promise<SustainabilityMetric[]>;
  createSustainabilityMetric(metric: InsertSustainability & { createdAt?: Date }): Promise<SustainabilityMetric>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(sql`lower(${users.username}) = lower(${username})`);
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db!.insert(users).values(user).returning();
    return newUser;
  }

  async getIncidents(): Promise<Incident[]> {
    return await db!.select().from(incidents).orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: number): Promise<Incident | undefined> {
    const [incident] = await db!.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(incident: InsertIncident & { reportedBy: number }): Promise<Incident> {
    const [newIncident] = await db!.insert(incidents).values(incident).returning();
    return newIncident;
  }

  async updateIncidentStatus(id: number, status: "open" | "under_review" | "resolved"): Promise<Incident | undefined> {
    const [updated] = await db!.update(incidents)
      .set({ status })
      .where(eq(incidents.id, id))
      .returning();
    return updated;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db!.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async getRisks(): Promise<Risk[]> {
    return await db!.select().from(risks).orderBy(desc(risks.createdAt));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [newRisk] = await db!.insert(risks).values(risk).returning();
    return newRisk;
  }

  async getStats() {
    const allIncidents = await db!.select().from(incidents);
    const totalIncidents = allIncidents.length;
    const activeCases = allIncidents.filter(i => i.status !== 'resolved').length;
    const resolvedCount = allIncidents.filter(i => i.status === 'resolved').length;
    const riskScore = Math.min(100, activeCases * 10 + allIncidents.filter(i => i.severity === 'critical').length * 20);

    return { totalIncidents, activeCases, riskScore, resolvedCount };
  }

  async getMessages(): Promise<Message[]> {
    const allMessages = await db!.select().from(messages).orderBy(desc(messages.createdAt)).limit(50);
    return allMessages.reverse();
  }

  async createMessage(message: InsertMessage & { userId: number }): Promise<Message> {
    const [newMessage] = await db!.insert(messages).values(message).returning();
    return newMessage;
  }

  async createPPEItem(item: InsertPPE): Promise<PPEItem> {
    const [newItem] = await db!.insert(ppeInventory).values(item).returning();
    return newItem;
  }

  // PPE
  async getPPEItems(): Promise<PPEItem[]> {
    return await db!.select().from(ppeInventory).orderBy(desc(ppeInventory.createdAt));
  }

  async updatePPEStatus(id: number, status: string): Promise<PPEItem | undefined> {
    const [updated] = await db!.update(ppeInventory).set({ status }).where(eq(ppeInventory.id, id)).returning();
    return updated;
  }

  // Metrics
  async getEnvironmentalMetrics(): Promise<Metric[]> {
    return await db!.select().from(environmentalMetrics).orderBy(asc(environmentalMetrics.id));
  }

  async createEnvironmentalMetric(metric: Partial<Metric>): Promise<Metric> {
    const [newMetric] = await db!.insert(environmentalMetrics).values(metric as any).returning();
    return newMetric;
  }

  async updateEnvironmentalMetric(id: number, value: string, status: string): Promise<Metric | undefined> {
    const [updated] = await db!.update(environmentalMetrics).set({ value, status }).where(eq(environmentalMetrics.id, id)).returning();
    return updated;
  }

  // Safety Measures
  async getSafetyMeasures(): Promise<SafetyMeasure[]> {
    return await db!.select().from(safetyMeasures).orderBy(desc(safetyMeasures.createdAt));
  }

  async createSafetyMeasure(measure: InsertSafetyMeasure): Promise<SafetyMeasure> {
    const [newMeasure] = await db!.insert(safetyMeasures).values(measure).returning();
    return newMeasure;
  }

  // Training
  async getTrainingCertifications(): Promise<TrainingCertification[]> {
    return await db!.select().from(trainingCertifications).orderBy(desc(trainingCertifications.expiryDate));
  }

  async createTrainingCertification(cert: InsertTraining): Promise<TrainingCertification> {
    const [newCert] = await db!.insert(trainingCertifications).values(cert).returning();
    return newCert;
  }

  // Sustainability
  async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> {
    return await db!.select().from(sustainabilityMetrics).orderBy(desc(sustainabilityMetrics.createdAt));
  }

  async createSustainabilityMetric(metric: InsertSustainability & { createdAt?: Date }): Promise<SustainabilityMetric> {
    const [newMetric] = await db!.insert(sustainabilityMetrics).values(metric).returning();
    return newMetric;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private incidents: Map<number, Incident>;
  private risks: Map<number, Risk>;
  private messages: Map<number, Message>;
  private ppe: Map<number, PPEItem>;
  private metrics: Map<number, Metric>;
  private safety: Map<number, SafetyMeasure>;
  private training: Map<number, TrainingCertification>;
  private sustainability: Map<number, SustainabilityMetric>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.incidents = new Map();
    this.risks = new Map();
    this.messages = new Map();
    this.ppe = new Map();
    this.metrics = new Map();
    this.safety = new Map();
    this.training = new Map();
    this.sustainability = new Map();
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> { return this.users.get(id); }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username.toLowerCase() === username.toLowerCase());
  }
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.googleId === googleId);
  }
  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId++;
    const newUser = { ...user, id, googleId: user.googleId || null, createdAt: new Date() } as User;
    this.users.set(id, newUser);
    return newUser;
  }
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...user };
    this.users.set(id, updated);
    return updated;
  }

  async getIncidents(): Promise<Incident[]> { 
    return Array.from(this.incidents.values()).sort((a,b) => {
      const timeA = a.createdAt?.getTime() || 0;
      const timeB = b.createdAt?.getTime() || 0;
      return timeB - timeA;
    }); 
  }
  async getIncident(id: number): Promise<Incident | undefined> { return this.incidents.get(id); }
  async createIncident(incident: InsertIncident & { reportedBy: number }): Promise<Incident> {
    const id = this.currentId++;
    const newIncident = { ...incident, id, status: (incident as any).status || 'open', createdAt: new Date() } as Incident;
    this.incidents.set(id, newIncident);
    return newIncident;
  }
  async updateIncidentStatus(id: number, status: "open" | "under_review" | "resolved"): Promise<Incident | undefined> {
    const existing = this.incidents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    this.incidents.set(id, updated);
    return updated;
  }

  async getRisks(): Promise<Risk[]> { 
    return Array.from(this.risks.values()).sort((a,b) => {
      const timeA = a.createdAt?.getTime() || 0;
      const timeB = b.createdAt?.getTime() || 0;
      return timeB - timeA;
    }); 
  }
  async createRisk(risk: InsertRisk): Promise<Risk> {
    const id = this.currentId++;
    const newRisk = { ...risk, id, createdAt: new Date() } as Risk;
    this.risks.set(id, newRisk);
    return newRisk;
  }

  async getStats() {
    const all = Array.from(this.incidents.values());
    const totalIncidents = all.length;
    const activeCases = all.filter(i => i.status !== 'resolved').length;
    const resolvedCount = all.filter(i => i.status === 'resolved').length;
    const riskScore = Math.min(100, activeCases * 10);
    return { totalIncidents, activeCases, riskScore, resolvedCount };
  }

  async getMessages(): Promise<Message[]> { return Array.from(this.messages.values()); }
  async createMessage(message: InsertMessage & { userId: number }): Promise<Message> {
    const id = this.currentId++;
    const newMessage = { ...message, id, createdAt: new Date() } as Message;
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getPPEItems(): Promise<PPEItem[]> { return Array.from(this.ppe.values()); }
  async updatePPEStatus(id: number, status: string): Promise<PPEItem | undefined> {
    const existing = this.ppe.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, status };
    this.ppe.set(id, updated);
    return updated;
  }

  async getEnvironmentalMetrics(): Promise<Metric[]> { return Array.from(this.metrics.values()); }
  async createEnvironmentalMetric(metric: Partial<Metric>): Promise<Metric> {
    const id = this.currentId++;
    const newMetric = { ...metric, id } as Metric;
    this.metrics.set(id, newMetric);
    return newMetric;
  }
  async updateEnvironmentalMetric(id: number, value: string, status: string): Promise<Metric | undefined> {
    const existing = this.metrics.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, value, status };
    this.metrics.set(id, updated);
    return updated;
  }

  async getSafetyMeasures(): Promise<SafetyMeasure[]> { return Array.from(this.safety.values()); }
  async createSafetyMeasure(measure: InsertSafetyMeasure): Promise<SafetyMeasure> {
    const id = this.currentId++;
    const newMeasure = { ...measure, id, createdAt: new Date(), completedAt: measure.completedAt || null } as SafetyMeasure;
    this.safety.set(id, newMeasure);
    return newMeasure;
  }

  async getTrainingCertifications(): Promise<TrainingCertification[]> { return Array.from(this.training.values()); }
  async createTrainingCertification(cert: InsertTraining): Promise<TrainingCertification> {
    const id = this.currentId++;
    const newCert = { ...cert, id } as TrainingCertification;
    this.training.set(id, newCert);
    return newCert;
  }

  async getSustainabilityMetrics(): Promise<SustainabilityMetric[]> { return Array.from(this.sustainability.values()); }
  async createSustainabilityMetric(metric: InsertSustainability & { createdAt?: Date }): Promise<SustainabilityMetric> {
    const id = this.currentId++;
    const newMetric = { 
      ...metric, 
      id, 
      createdAt: metric.createdAt || new Date() 
    } as SustainabilityMetric;
    this.sustainability.set(id, newMetric);
    return newMetric;
  }

  async createPPEItem(item: InsertPPE): Promise<PPEItem> {
    const id = this.currentId++;
    const newItem = { ...item, id, createdAt: new Date() } as PPEItem;
    this.ppe.set(id, newItem);
    return newItem;
  }
}

export const storage = hasDb ? new DatabaseStorage() : new MemStorage();
