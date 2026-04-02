import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema.js";

const { Pool } = pg;

export const isDev = process.env.NODE_ENV !== "production";
console.log("DB Init: hasDb =", !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("REPLACE_ME"));
export const hasDb = process.env.DATABASE_URL && 
                   !process.env.DATABASE_URL.includes("REPLACE_ME") && 
                   process.env.DATABASE_URL.startsWith("postgres");

if (!hasDb) {
  console.warn("WARNING: DATABASE_URL is not set or invalid. Database features will be unavailable.");
}

export const pool = hasDb ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = pool ? drizzle(pool, { schema }) : null;
