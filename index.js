import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import crypto from "crypto";
import { sendChunks } from "./messageQueue.js";
import { config } from "./config.js";
import { processJsonData } from "./jsonProcessor.js";
import githubRoutes from "./github.js"; // Import the GitHub-related routes

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Increase payload size limit
app.use(express.json({ limit: '50mb' })); // Increase limit as needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // Increase limit as needed
app.use(express.static(path.join(__dirname, "public")));

// Initialize variables
let latestDiffResult = null;
let configData = {};

// Use the routes from github.js with the /github prefix
app.use("/github", githubRoutes); // Prefix all GitHub-related routes with /github

// Endpoint to calculate the difference between two JSON arrays
app.post("/api/diff", async (req, res) => {
  try {
    const { json1, json2 } = req.body;

    if (!Array.isArray(json1) || !Array.isArray(json2)) {
      return res
        .status(400)
        .json({ error: "Both json1 and json2 should be arrays." });
    }

    // Use the jsonProcessor to handle the diff and related calculations
    const result = await processJsonData(json1, json2);

    latestDiffResult = result;

    const chunks = [latestDiffResult];
    await sendChunks(chunks);

    res.json(latestDiffResult);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error processing. Ensure both JSON objects are valid." });
  }
});

// Endpoint to get the latest diff result
app.get("/api/latest-diff", (req, res) => {
  if (latestDiffResult) {
    res.json(latestDiffResult);
  } else {
    res.status(404).json({
      error:
        "No diff data available. Please provide JSON data through the /api/diff endpoint first.",
    });
  }
});

// Endpoint to get the current configuration JSON
app.get("/api/config", (req, res) => {
  res.json(configData);
});

// Endpoint to update the configuration JSON
app.post("/api/update-config", (req, res) => {
  try {
    configData = req.body;
    res.status(200).json({ message: "Configuration updated successfully." });
  } catch (error) {
    res.status(400).json({ error: "Invalid JSON data." });
  }
});

// SHA256 hash endpoint
app.get("/api/integrity", (req, res) => {
  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(latestDiffResult || {})) // Ensure latestDiffResult is defined
    .digest('hex');
  res.json({ result: hash });
});

// Base64 encode endpoint
app.get("/api/base64encode", (req, res) => {
  const base64 = Buffer.from(JSON.stringify(latestDiffResult || {})).toString('base64'); // Ensure latestDiffResult is defined
  res.json({ result: base64 });
});

// Create and start the server
const server = http.createServer(app);

server.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
