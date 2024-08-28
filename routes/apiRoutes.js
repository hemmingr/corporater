import express from "express";
import crypto from "crypto";
import { processJsonData } from "../services/jsonProcessor.js";
import { sendChunks } from "../services/messageQueue.js";
import {
  updatePluginExtendedFile,
  calculateMetrics,
} from "../services/githubService.js";
import { processIds } from "../services/idProcessor.js";
import logger from "../services/logger.js"; // Import the logger
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ignore from "ignore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

let latestDiffResult = null;
let configData = {};

router.post("/diff", async (req, res) => {
  try {
    const { json1, json2 } = req.body;

    if (!Array.isArray(json1) || !Array.isArray(json2)) {
      return res
        .status(400)
        .json({ error: "Both json1 and json2 should be arrays." });
    }

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

router.get("/latest-diff", (req, res) => {
  if (latestDiffResult) {
    res.json(latestDiffResult);
  } else {
    res.status(404).json({
      error:
        "No diff data available. Please provide JSON data through the /api/diff endpoint first.",
    });
  }
});

router.get("/config", (req, res) => {
  res.json(configData);
});

router.post("/update-config", (req, res) => {
  try {
    configData = req.body;
    res.status(200).json({ message: "Configuration updated successfully." });
  } catch (error) {
    res.status(400).json({ error: "Invalid JSON data." });
  }
});

router.post("/integrity", (req, res) => {
  const { data } = req.body;
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(data || {}))
    .digest("hex");
  res.json({ result: hash });
});

router.post("/base64encode", express.text(), (req, res) => {
  const text = req.body;

  if (typeof text !== "string" || text.trim() === "") {
    return res
      .status(400)
      .json({ error: "Text is required and must be a non-empty string" });
  }

  const base64 = Buffer.from(text).toString("base64");
  res.json({ result: base64 });
});

const processText = (text) => {
  const cleanedText = text.replace(/<BR\/>/g, "\n");
  const lines = cleanedText.split("\n");

  const rows = [];
  const base64Pattern = /^[a-zA-Z0-9+/=]{40,}$/;

  let currentBase64Data = "";
  let rowIndex = 1;

  lines.forEach((line) => {
    let cleanedLine = line.replace(/<[^>]*>/g, "").trim();
    const isBase64Data = base64Pattern.test(cleanedLine);

    if (isBase64Data) {
      currentBase64Data += cleanedLine + "\n";
    } else {
      if (currentBase64Data) {
        rows.push({ id: rowIndex++, exp: currentBase64Data.trim() });
        currentBase64Data = "";
      }
      if (cleanedLine) {
        rows.push({ id: rowIndex++, exp: cleanedLine });
      }
    }
  });

  if (currentBase64Data) {
    rows.push({ id: rowIndex++, exp: currentBase64Data.trim() });
  }

  return { rows };
};

router.post("/genextended", express.text(), async (req, res) => {
  const text = req.body;

  if (typeof text !== "string" || text.trim() === "") {
    return res
      .status(400)
      .json({ error: "Text is required and must be a non-empty string" });
  }

  try {
    const result = processText(text);
    await updatePluginExtendedFile(result.rows); // Ensure this function is called correctly
    res.json(result);
  } catch (error) {
    console.error(
      "Error processing text or updating GitHub file:",
      error.message
    ); // Improved error logging
    res.status(500).json({
      error:
        "Error processing text. Please check the input format and try again.",
    });
  }
});

router.get("/get-api-key", (req, res) => {
  res.json({ apiKey: process.env.API_KEY });
});

router.post("/process-ids", express.json(), (req, res) => {
  const { inputText, typeMappingsPrefix } = req.body;
  const cleanedText = inputText.replace(/<BR\/>/g, "\n");

  if (typeof cleanedText !== "string" || cleanedText.trim() === "") {
    return res
      .status(400)
      .json({ error: "Input is required and must be a non-empty string" });
  }

  const processedNames = processIds(cleanedText, typeMappingsPrefix);
  res.json(processedNames);
});

router.get("/file-structure", (req, res) => {
  const directoryPath = process.cwd(); // Use the current working directory
  const ig = ignore();

  // Read .gitignore file
  const gitignorePath = path.join(directoryPath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    ig.add(gitignoreContent);
  }

  const getFileStructure = (dirPath) => {
    const files = fs.readdirSync(dirPath);
    return files
      .filter((file) => {
        const filePath = path.join(dirPath, file);
        const isIgnored = ig.ignores(path.relative(directoryPath, filePath));
        const isHidden = file.startsWith(".");
        const isLogOrYaml = file.endsWith(".log") || file.endsWith(".yaml");
        const containsLock = file.includes("lock");
        return !isIgnored && !isHidden && !isLogOrYaml && !containsLock;
      })
      .map((file) => {
        const filePath = path.join(dirPath, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        return {
          name: file,
          isDirectory,
          children: isDirectory ? getFileStructure(filePath) : [],
        };
      });
  };

  res.json(getFileStructure(directoryPath));
});

router.get("/metrics", async (req, res) => {
  try {
    const metrics = await calculateMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

export default router;
