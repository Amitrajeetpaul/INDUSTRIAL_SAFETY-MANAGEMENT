import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { User as SelectUser } from "../shared/schema.js";
import { pool, hasDb } from "./db.js";
import connectPg from "connect-pg-simple";
import MemoryStoreFactory from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);
const PostgresSessionStore = connectPg(session);
const MemoryStore = MemoryStoreFactory(session);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r3pl1t_s3cur1ty_k3y",
    resave: false,
    saveUninitialized: false,
    store: hasDb && pool 
      ? new PostgresSessionStore({ pool, createTableIfMissing: true }) 
      : new MemoryStore({ checkPeriod: 86400000 }),
    cookie: {
      secure: app.get("env") === "production",
      maxAge: 24 * 60 * 60 * 1000,
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          let user = await storage.getUserByGoogleId(googleId);

          if (!user) {
            // Check if user exists by email (if username stores email)
            const email = profile.emails?.[0]?.value;
            if (email) {
              user = await storage.getUserByUsername(email);
              if (user) {
                // Link account
                await storage.updateUser(user.id, { googleId });
                return done(null, user);
              }
            }

            // Create new user
            const username = email || `google_${googleId}`;
            const password = await hashPassword(randomBytes(16).toString("hex")); // Dummy password

            user = await storage.createUser({
              username,
              password,
              role: "worker", // Default role
              name: profile.displayName
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    ));
  }

  passport.serializeUser((user, done) => done(null, (user as SelectUser).id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id as number);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email found in Google profile"));

          let user = await storage.getUserByUsername(email);
          if (!user) {
            user = await storage.createUser({
              username: email,
              password: "google-oauth-managed",
              role: "worker",
              name: profile.displayName
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    ));

    app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    app.get("/api/auth/google/callback", 
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => res.redirect("/")
    );
  } else {
    app.get("/api/auth/google", (req, res) => {
      res.status(400).send("Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel environment variables.");
    });
  }

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser, _info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Google Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (_req, res) => {
      // Successful authentication, redirect dashboard.
      res.redirect("/");
    }
  );

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
