import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import bodyParser from "body-parser";
import axios from "axios";
import { config } from "./config/config.js";
import githubRoutes from "./routes/githubRoutes.js";
import apiRoutes from "./routes/apiRoutes.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import winston from "winston";
import expressWinston from "express-winston";
import { WebSocketServer } from "ws";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import dns from "dns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let serverIpInfo = null; // Define serverIpInfo

// Fetch IP information
const fetchIpInfo = async () => {
  try {
    const response = await axios.get("https://ipinfo.io/json");
    serverIpInfo = response.data;
    //console.log("Server IP information:", serverIpInfo);
  } catch (error) {
    console.error("Error fetching IP information:", error);
  }
};

// Fetch IP information on server start
fetchIpInfo();

// Set trust proxy
app.set("trust proxy", 1); // Trust the first proxy

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      },
    },
    xContentTypeOptions: true, // Add this line to include the X-Content-Type-Options header
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Corporater API",
      version: "1.0.0",
      description: "Corporater API documentation",
    },
    servers: [
      {
        url: `https://localhost:${config.port}`,
      },
    ],
  },
  apis: ["./doc/*.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Log all requests
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      const logMessage = `${timestamp} ${level}: ${message}`;
      console.log("Emitting log message:", logMessage); // Debug log
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(logMessage);
        }
      });
      return logMessage;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "requests.log" }),
  ],
});

app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: false,
  })
);

app.use("/github", githubRoutes);
app.use("/api", apiRoutes);

app.get("/idprocessor", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "idprocessor.html"));
});

app.get("/view-config", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view-config.html"));
});

app.get("/file-structure", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "file-structure.html"));
});

app.get("/uptime", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "uptime.html"));
});

app.get("/", (req, res) => {
  res.send("Welcome to the JSON API service");
});

// New endpoint to display server IP information
app.get("/server-info", (req, res) => {
  if (serverIpInfo) {
    res.json(serverIpInfo);
  } else {
    res.status(500).json({ error: "Unable to fetch server IP information" });
  }
});

// Endpoint to get client hostname
app.get("/client-info", (req, res) => {
  const clientIp = req.ip;
  dns.reverse(clientIp, (err, hostnames) => {
    if (err) {
      res.status(500).json({ error: "Unable to perform reverse DNS lookup" });
    } else {
      res.json({ ip: clientIp, hostnames });
    }
  });
});

app.get("/logs", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "logs.html"));
});

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

wss.on("connection", (ws) => {
  console.log("WebSocket client connected");
  ws.send("WebSocket connection established"); // Debug log

  ws.on("message", (message) => {
    console.log("Received message from client:", message); // Debug log
  });

  ws.on("close", () => {
    console.log("WebSocket client disconnected"); // Debug log
  });
});
