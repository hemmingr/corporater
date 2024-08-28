import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { config } from "./config/config.js";
import setupMiddleware from "./middleware/index.js";
import setupLogging from "./logging/index.js";
import setupRoutes from "./routes/index.js";
import setupSwagger from "./doc/swaggerSetup.js";
import fetchIpInfo from "./services/ipService.js";
import { passport } from "./config/auth.js"; // Use named import
import session from "express-session";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const initializeServer = async () => {
  const serverIpInfo = await fetchIpInfo();

  app.set("trust proxy", 1);

  setupMiddleware(app); // Setup middleware
  setupLogging(app, server);

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Pass serverIpInfo to routes
  app.use((req, res, next) => {
    req.serverIpInfo = serverIpInfo;
    next();
  });

  app.use("/", setupRoutes); // Use your existing routes
  setupSwagger(app); // Use the new Swagger setup module

  app.use(express.static(path.join(__dirname, "public")));

  const serverInstance = server.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received: closing HTTP server");
    serverInstance.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    serverInstance.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
};

initializeServer();
