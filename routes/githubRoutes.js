import express from "express";
import {
  getConfigFile,
  saveConfigFile,
  getCommits,
} from "../services/githubService.js";
import logger from '../services/logger.js'; // Import the logger
const router = express.Router();

/**
 * @swagger
 * /github/config:
 *   get:
 *     summary: Fetch the configuration file from GitHub
 *     responses:
 *       200:
 *         description: The configuration file content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Failed to fetch JSON from GitHub
 */
router.get("/config", async (req, res) => {
  try {
    const content = await getConfigFile();
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch JSON from GitHub" });
  }
});

/**
 * @swagger
 * /github/save-config:
 *   post:
 *     summary: Save the configuration file to GitHub
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Configuration saved successfully
 *       400:
 *         description: Invalid JSON data
 *       500:
 *         description: Failed to save configuration
 */
router.post("/save-config", async (req, res) => {
  try {
    const editedData = req.body;
    if (typeof editedData !== "object" || Array.isArray(editedData)) {
      return res.status(400).json({ error: "Invalid JSON data" });
    }

    const content = await getConfigFile();
    const sha = JSON.parse(content).sha;

    await saveConfigFile(editedData, sha);

    res.json({ message: "Configuration saved successfully" });
  } catch (error) {
    console.error("Error saving configuration:", error.message);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

/**
 * @swagger
 * /github/commits:
 *   get:
 *     summary: Fetch the commits from GitHub
 *     responses:
 *       200:
 *         description: The list of commits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: Failed to fetch commits
 */
router.get("/commits", async (req, res) => {
  try {
    const commits = await getCommits();
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch commits" });
  }
});

export default router;
