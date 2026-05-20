/**
 * Express application factory.
 *
 * Wires up middlewares, view engine, static assets, sessions, routes,
 * and the global error handler. The server is started in `index.js`.
 */

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import expressLayouts from "express-ejs-layouts";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { openApiSpec } from "./docs/swagger.js";
import requestLogger from "./middlewares/logger.js";
import { attachUser } from "./middlewares/auth.js";
import notFoundHandler from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import router from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// EJS view engine + shared layout
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

// Trust the Replit reverse proxy for correct IPs / secure cookies
app.set("trust proxy", 1);

// Security & performance
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({ origin: true, credentials: true }));

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sessions (cookie-backed, persisted in MongoDB)
app.use(
  session({
    name: "filmfusion.sid",
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// Custom request logger
app.use(requestLogger);

// Static assets — exposed under /public so the EJS layout can use base + "public/..."
app.use("/public", express.static(path.join(__dirname, "public")));

// Per-request user
app.use(attachUser);

// Locals available to every EJS template
app.use((req, res, next) => {
  res.locals.currentUser = req.user || null;
  res.locals.currentQuery = req.query || {};
  res.locals.path = req.path;
  res.locals.base = "/";
  res.locals.flash = req.session?.flash || null;
  if (req.session) req.session.flash = null;
  next();
});

// Swagger UI + JSON spec
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/api/docs.json", (_req, res) => res.json(openApiSpec));

// Mount all application routes (API + SSR)
app.use(router);

// 404 + global error handler (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
