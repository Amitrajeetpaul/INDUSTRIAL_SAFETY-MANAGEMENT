import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";

import { registerRoutes } from "../server/routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let isInitialized = false;
const httpServer = createServer(app);

app.use(async (req, res, next) => {
  if (isInitialized) return next();
  
  console.log("Vercel Boot: Initializing routes...");
  try {
    await registerRoutes(httpServer, app);
    isInitialized = true;
    console.log("Vercel Boot: Registration complete.");
    next();
  } catch (err: any) {
    console.error("Vercel Boot CRASH:", err);
    res.status(500).json({ 
      message: "Server failed to start", 
      error: err.message,
      stack: err.stack
    });
  }
});

app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  console.error("Vercel Runtime Error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

export default app;
