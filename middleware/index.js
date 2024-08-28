// middleware/index.js
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import ipRangeCheck from "ip-range-check";
import cors from "cors";
import { config } from "../config/config.js";

const setupMiddleware = (app) => {
  app.use(cors()); // Use CORS middleware

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
          styleSrc: ["'self'", "https://cdnjs.cloudflare.com", "'unsafe-inline'"], // Allow inline styles
          connectSrc: ["'self'", "https://localhost:3000"], // Allow connections to http://localhost:3000
        },
      },
      xContentTypeOptions: true,
    })
  );

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use(limiter);

  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  const allowedRanges = config.allowedIpRanges;
  app.use((req, res, next) => {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : req.connection.remoteAddress;
    const isAllowed = ipRangeCheck(clientIp, allowedRanges);
    console.log(`IP ${clientIp} is allowed: ${isAllowed}`);
    if (isAllowed) {
      next();
    } else {
      res.status(403).send("Access denied");
    }
  });
};

export default setupMiddleware;
