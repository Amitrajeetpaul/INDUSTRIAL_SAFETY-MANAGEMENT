import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const httpServer = createServer(app);

// Register API routes
let routesPromise: Promise<any> | null = null;
const initRoutes = async () => {
  if (!routesPromise) {
    console.log("Vercel Boot: Initializing routes...");
    routesPromise = registerRoutes(httpServer, app)
      .then(() => console.log("Vercel Boot: Registration complete"))
      .catch(err => {
        console.error("Vercel Boot: Registration FAILED", err);
        throw err;
      });
  }
  return routesPromise;
};

// Middleware to ensure routes are initialized
app.use(async (req, res, next) => {
  try {
    await initRoutes();
    next();
  } catch (err) {
    next(err);
  }
});

// Error handling
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Vercel API Error:", err);
  if (err.stack) console.error(err.stack);
  res.status(status).json({ 
    message, 
    error: process.env.NODE_ENV === "development" ? err.message : undefined 
  });
});

export default app;
