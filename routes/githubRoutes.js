// routes/githubRoutes.js

import express from 'express';
import authOrApiKey from '../middleware/authOrApiKey.js'; // Import the combined auth middleware
import {
  getConfigFile,
  saveConfigFile,
  getCommits,
  calculateMetrics,
} from '../services/githubService.js';
import logger from '../services/logger.js'; // Import the logger

const router = express.Router();

// Apply the combined auth middleware to all GitHub routes
router.use(authOrApiKey);

router.get('/config', async (req, res) => {
  try {
    console.log('Received request for /github/config');
    const content = await getConfigFile();
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Error fetching JSON from GitHub:', error.message);
    res.status(500).json({ error: 'Failed to fetch JSON from GitHub' });
  }
});

router.post('/save-config', async (req, res) => {
  try {
    const editedData = req.body;
    if (typeof editedData !== 'object' || Array.isArray(editedData)) {
      return res.status(400).json({ error: 'Invalid JSON data' });
    }

    const content = await getConfigFile();
    const sha = JSON.parse(content).sha;

    await saveConfigFile(editedData, sha);

    res.json({ message: 'Configuration saved successfully' });
  } catch (error) {
    console.error('Error saving configuration:', error.message);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

router.get('/commits', async (req, res) => {
  try {
    const commits = await getCommits();
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commits' });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await calculateMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

export default router;
