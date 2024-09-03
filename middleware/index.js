import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import ipRangeCheck from "ip-range-check";
import cors from "cors";
import trackRequests from "./trafficMetrics.js"; // Import the traffic metrics middleware

// Middleware to check if the user is authenticated
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

const setupMiddleware = (app, config) => {
  // CORS setup
  app.use(cors({
    origin: 'https://corporater-deployment.glitch.me', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "https://cdnjs.cloudflare.com",
            "https://cdn.jsdelivr.net",
          ],
          styleSrc: [
            "'self'",
            "https://cdnjs.cloudflare.com",
            "'unsafe-inline'",
          ],
          connectSrc: [
            "'self'",
            "https://localhost:3000",
            "https://newfeaturemaster.innovation.corporater.dev",
            "https://deployment.innovation.corporater.dev",
            "https://basic.innovation.corporater.dev"
          ],
          imgSrc: ["'self'", "data:"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      xContentTypeOptions: true,
      referrerPolicy: { policy: "no-referrer" },
      frameguard: { action: "deny" },
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
  });
  app.use(limiter);

  // Body parsing
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

  // IP range checking
  const allowedRanges = config.allowedIpRanges;
  app.use((req, res, next) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0]
      : req.connection.remoteAddress;
    const isAllowed = ipRangeCheck(clientIp, allowedRanges);
    console.log(`IP ${clientIp} is allowed: ${isAllowed}`);
    if (isAllowed) {
      next();
    } else {
      res.status(403).send("Access denied");
    }
  });

  // Traffic tracking
  app.use(trackRequests);
};

export { setupMiddleware, ensureAuthenticated };
