import { pgTable, text, serial, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["admin", "manager", "worker"]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);
export const statusEnum = pgEnum("status", ["open", "under_review", "resolved"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").default("worker").notNull(),
  name: text("name").notNull(),
  googleId: text("google_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  severity: severityEnum("severity").notNull(),
  status: statusEnum("status").default("open").notNull(),
  imageUrl: text("image_url"),
  reportedBy: integer("reported_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  hazard: text("hazard").notNull(),
  description: text("description").notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  mitigation: text("mitigation").notNull(),
  status: text("status").default("active").notNull(), // active, mitigated
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ppeInventory = pgTable("ppe_inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "Hard Hat", "Harness"
  serialNumber: text("serial_number").notNull().unique(),
  manufactureDate: timestamp("manufacture_date").notNull(),
  lastInspectionDate: timestamp("last_inspection_date").notNull(),
  nextInspectionDate: timestamp("next_inspection_date").notNull(),
  status: text("status").default("ok").notNull(), // ok, expired, maintenance_due
  createdAt: timestamp("created_at").defaultNow(),
});

export const environmentalMetrics = pgTable("environmental_metrics", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // air, water, machine
  label: text("label").notNull(), // e.g., "PM2.5", "pH Level", "Vibration"
  value: text("value").notNull(),
  unit: text("unit").notNull(),
  status: text("status").default("optimal").notNull(), // optimal, warning, critical
  createdAt: timestamp("created_at").defaultNow(),
});

export const safetyMeasures = pgTable("safety_measures", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").references(() => incidents.id),
  description: text("description").notNull(),
  actionTaken: text("action_taken").notNull(),
  status: text("status").default("planned").notNull(), // planned, in_progress, completed
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trainingCertifications = pgTable("training_certifications", {
  id: serial("id").primaryKey(),
  workerName: text("worker_name").notNull(),
  courseName: text("course_name").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  status: text("status").default("valid").notNull(), // valid, expiring_soon, expired
  createdAt: timestamp("created_at").defaultNow(),
});

export const sustainabilityMetrics = pgTable("sustainability_metrics", {
  id: serial("id").primaryKey(),
  area: text("area").notNull(), // e.g., "Production Line A", "Main Office"
  consumption: text("consumption").notNull(), // value in kWh
  carbonFootprint: text("carbon_footprint").notNull(), // value in kg CO2
  unit: text("unit").default("kWh").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertIncidentSchema = createInsertSchema(incidents).omit({ id: true, createdAt: true, status: true, reportedBy: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertPPESchema = createInsertSchema(ppeInventory).omit({ id: true, createdAt: true });
export const insertMetricSchema = createInsertSchema(environmentalMetrics).omit({ id: true, createdAt: true });
export const insertSafetyMeasureSchema = createInsertSchema(safetyMeasures).omit({ id: true, createdAt: true });
export const insertTrainingSchema = createInsertSchema(trainingCertifications).omit({ id: true, createdAt: true });
export const insertSustainabilitySchema = createInsertSchema(sustainabilityMetrics).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type PPEItem = typeof ppeInventory.$inferSelect;
export type InsertPPE = z.infer<typeof insertPPESchema>;
export type Metric = typeof environmentalMetrics.$inferSelect;
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type SafetyMeasure = typeof safetyMeasures.$inferSelect;
export type InsertSafetyMeasure = z.infer<typeof insertSafetyMeasureSchema>;
export type TrainingCertification = typeof trainingCertifications.$inferSelect;
export type InsertTraining = z.infer<typeof insertTrainingSchema>;
export type SustainabilityMetric = typeof sustainabilityMetrics.$inferSelect;
export type InsertSustainability = z.infer<typeof insertSustainabilitySchema>;

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  incidents: {
    list: {
      method: 'GET' as const,
      path: '/api/incidents' as const,
      responses: {
        200: z.array(z.custom<Incident>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/incidents' as const,
      input: insertIncidentSchema,
      responses: {
        201: z.custom<Incident>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/incidents/:id' as const,
      responses: {
        200: z.custom<Incident>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/incidents/:id' as const,
      input: z.object({ status: z.enum(["open", "under_review", "resolved"]) }),
      responses: {
        200: z.custom<Incident>(),
        404: errorSchemas.notFound,
      },
    },
  },
  risks: {
    list: {
      method: 'GET' as const,
      path: '/api/risks' as const,
      responses: {
        200: z.array(z.custom<Risk>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/risks' as const,
      input: insertRiskSchema,
      responses: {
        201: z.custom<Risk>(),
        400: errorSchemas.validation,
      },
    },
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/messages' as const,
      responses: {
        200: z.array(z.custom<Message>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/messages' as const,
      input: insertMessageSchema,
      responses: {
        201: z.custom<Message>(),
        400: errorSchemas.validation,
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats' as const,
      responses: {
        200: z.object({
          totalIncidents: z.number(),
          activeCases: z.number(),
          riskScore: z.number(),
          resolvedCount: z.number(),
        }),
      },
    },
  },
  ppe: {
    list: {
      method: 'GET' as const,
      path: '/api/ppe' as const,
      responses: {
        200: z.array(z.custom<PPEItem>()),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/ppe/:id' as const,
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<PPEItem>(),
        404: errorSchemas.notFound,
      },
    },
  },
  metrics: {
    list: {
      method: 'GET' as const,
      path: '/api/metrics' as const,
      responses: {
        200: z.array(z.custom<Metric>()),
      },
    },
  },
  safetyMeasures: {
    list: {
      method: 'GET' as const,
      path: '/api/safety-measures' as const,
      responses: {
        200: z.array(z.custom<SafetyMeasure>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/safety-measures' as const,
      input: insertSafetyMeasureSchema,
      responses: {
        201: z.custom<SafetyMeasure>(),
        400: errorSchemas.validation,
      },
    },
  },
  training: {
    list: {
      method: 'GET' as const,
      path: '/api/training' as const,
      responses: {
        200: z.array(z.custom<TrainingCertification>()),
      },
    },
  },
  sustainability: {
    list: {
      method: 'GET' as const,
      path: '/api/sustainability' as const,
      responses: {
        200: z.array(z.custom<SustainabilityMetric>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
