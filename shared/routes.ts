import { z } from 'zod';
import { insertUserSchema, insertIncidentSchema, insertRiskSchema, users, incidents, risks } from './schema';

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
        200: z.custom<typeof users.$inferSelect>(),
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
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  incidents: {
    list: {
      method: 'GET' as const,
      path: '/api/incidents' as const,
      responses: {
        200: z.array(z.custom<typeof incidents.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/incidents' as const,
      input: insertIncidentSchema,
      responses: {
        201: z.custom<typeof incidents.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/incidents/:id' as const,
      responses: {
        200: z.custom<typeof incidents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/incidents/:id' as const,
      input: z.object({ status: z.enum(["open", "under_review", "resolved"]) }),
      responses: {
        200: z.custom<typeof incidents.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  risks: {
    list: {
      method: 'GET' as const,
      path: '/api/risks' as const,
      responses: {
        200: z.array(z.custom<typeof risks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/risks' as const,
      input: insertRiskSchema,
      responses: {
        201: z.custom<typeof risks.$inferSelect>(),
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
