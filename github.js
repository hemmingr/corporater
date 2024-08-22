import express from "express";
import axios from "axios";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// GitHub configuration
const repoOwner = "hemmingr"; // GitHub repository owner
const repoName = "corporater"; // GitHub repository name
const filePath = "setup.json"; // Path of the file in the repository
const branch = "main"; // Branch where the file is located

// GitHub Token from environment variables
const githubToken = process.env.GITHUB_TOKEN;
const githubApiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

// Uptime Robot configuration
const uptimeRobotApiKey = process.env.UPTIME_ROBOT_API_KEY;
const uptimeRobotApiUrl = "https://api.uptimerobot.com/v2/getMonitors";

// Endpoint to fetch and return the JSON from GitHub
router.get("/api/config", async (req, res) => {
  try {
    const response = await axios.get(githubApiUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });
    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8"
    );
    res.json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch JSON from GitHub" });
  }
});

// Endpoint to save the edited JSON data to GitHub
router.post("/api/save-config", async (req, res) => {
  try {
    const editedData = req.body;
    if (typeof editedData !== "object" || Array.isArray(editedData)) {
      return res.status(400).json({ error: "Invalid JSON data" });
    }

    // Fetch the current file to get its SHA
    const { data: fileData } = await axios.get(githubApiUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
      },
    });
    const sha = fileData.sha;

    // Create a commit with the new file content
    const response = await axios.put(
      githubApiUrl,
      {
        message: "Update setup.json",
        content: Buffer.from(JSON.stringify(editedData, null, 2)).toString(
          "base64"
        ),
        sha: sha,
        branch: branch,
      },
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );

    res.json({ message: "Config saved successfully", data: response.data });
  } catch (error) {
    console.error("Error handling POST request:", error.message);
    res.status(500).json({ error: "Failed to save JSON data" });
  }
});

// Endpoint to get the last 5 commits
router.get("/api/commits", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/commits`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );

    // Get the last 5 commits
    const commits = response.data.slice(0, 5).map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: commit.commit.committer.date,
    }));

    res.json(commits);
  } catch (error) {
    console.error("Error fetching commits:", error);
    res.status(500).json({ error: "Failed to fetch commit history" });
  }
});

// Endpoint to revert to a specific version
router.post("/api/revert", async (req, res) => {
  const { version } = req.body;

  try {
    // Fetch content from a specific tag (commit SHA)
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${version}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );
    const content = Buffer.from(response.data.content, "base64").toString(
      "utf-8"
    );

    // Update the file to the reverted content
    await axios.put(
      githubApiUrl,
      {
        message: `Revert to version ${version}`,
        content: Buffer.from(content).toString("base64"),
        sha: response.data.sha,
        branch: branch,
      },
      {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      }
    );

    res.json({ message: `Reverted to version ${version}` });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to revert to the specified version" });
  }
});

// Endpoint to create or update a hash file
router.post("/api/hash", async (req, res) => {
  const { text, initial } = req.body;

  if (typeof text !== "string" || text.trim() === "") {
    return res
      .status(400)
      .json({ error: "Text is required and must be a non-empty string" });
  }

  try {
    const hash = crypto.createHash("sha256").update(text).digest("hex");
    const hashFilePath = "hashes/latest-hash.json";
    const hashFileUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${hashFilePath}`;

    if (initial) {
      // Create or update the file with the hash
      const content = Buffer.from(JSON.stringify({ hash }, null, 2)).toString(
        "base64"
      );
      await axios.put(
        hashFileUrl,
        {
          message: "Initial hash file creation",
          content: content,
          branch: branch,
        },
        {
          headers: {
            Authorization: `token ${githubToken}`,
          },
        }
      );
      return res.json({ message: "Hash file created successfully" });
    } else {
      // Compare the hash with the existing file
      const { data: fileData } = await axios.get(hashFileUrl, {
        headers: {
          Authorization: `token ${githubToken}`,
        },
      });

      const existingHash = Buffer.from(fileData.content, "base64").toString(
        "utf-8"
      );
      const isMatch = existingHash === JSON.stringify({ hash }, null, 2);

      res.json({
        message: isMatch ? "Hash matches" : "Hash does not match",
        match: isMatch,
      });
    }
  } catch (error) {
    console.error("Error handling hash request:", error.message);
    res.status(500).json({ error: "Failed to handle hash request" });
  }
});

// Endpoint to fetch Uptime Robot data
router.get("/api/uptime", async (req, res) => {
  try {
    const response = await axios.post(
      uptimeRobotApiUrl,
      new URLSearchParams({ api_key: uptimeRobotApiKey }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching uptime data:", error);
    res.status(500).json({ error: "Failed to fetch uptime data" });
  }
});

// Route to serve the uptime monitor page
router.get("/uptime", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "uptime.html"));
});

// Route to serve the formatted JSON page
router.get("/view-config", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "view-config.html"));
});

export default router;
