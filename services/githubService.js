import axios from "axios";
import { config } from "../config/config.js";
import logger from './logger.js'; // Import the logger

const githubToken = process.env.GITHUB_TOKEN;
const repoOwner = "hemmingr";
const repoName = "corporater";
const branch = "main";

const getFileUrl = (filePath) =>
  `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

const updateFile = async (filePath, content) => {
  const fileUrl = getFileUrl(filePath);
  try {
    const { data: fileData } = await axios.get(fileUrl, {
      headers: { Authorization: `token ${githubToken}` },
    });

    await axios.put(
      fileUrl,
      {
        message: "Update " + filePath,
        content: Buffer.from(content).toString("base64"),
        sha: fileData.sha,
        branch: branch,
      },
      {
        headers: { Authorization: `token ${githubToken}` },
      }
    );

    console.log(`Successfully updated ${filePath} on GitHub`);
  } catch (error) {
    console.error(
      `Error updating or creating file ${filePath}:`,
      error.message
    );
    throw error;
  }
};

const getConfigFile = async () => {
  try {
    const response = await axios.get(getFileUrl("setup.json"), {
      headers: { Authorization: `token ${githubToken}` },
    });
    return Buffer.from(response.data.content, "base64").toString("utf-8");
  } catch (error) {
    console.error("Error fetching config file:", error.message);
    throw error;
  }
};

const saveConfigFile = async (editedData, sha) => {
  try {
    await axios.put(
      getFileUrl("setup.json"),
      {
        message: "Update setup.json",
        content: Buffer.from(JSON.stringify(editedData, null, 2)).toString(
          "base64"
        ),
        sha: sha,
        branch: branch,
      },
      {
        headers: { Authorization: `token ${githubToken}` },
      }
    );
  } catch (error) {
    console.error("Error saving config file:", error.message);
    throw error;
  }
};

const getCommits = async () => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/commits`,
      {
        headers: { Authorization: `token ${githubToken}` },
      }
    );
    return response.data.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: commit.commit.committer.date,
    }));
  } catch (error) {
    console.error("Error fetching commits:", error.message);
    throw error;
  }
};

const updatePluginExtendedFile = async (rows) => {
  const filePath = "plugin.extended";
  const content = rows.map((row) => row.exp).join("\n");

  await updateFile(filePath, content);

  console.log("plugin.extended file has been updated successfully.");
};

export {
  updateFile,
  getConfigFile,
  saveConfigFile,
  getCommits,
  updatePluginExtendedFile,
};
