import winston from "winston";
import expressWinston from "express-winston";
import { WebSocketServer } from "ws";
import { config } from "../config/config.js";

const setupLogging = (app, server) => {
  const wss = new WebSocketServer({ server });

  const logger = winston.createLogger({
    level: config.logLevel,
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.json(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        const logMessage = `${timestamp} ${level}: ${message}`;
        console.log("Emitting log message:", logMessage);
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
      new winston.transports.File({ filename: 'combined.log' }),
      new winston.transports.File({ filename: 'errors.log', level: 'error' }),
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

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.send("WebSocket connection established");

    ws.on("message", (message) => {
      console.log("Received message from client:", message);
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
};

export default setupLogging;
