// services/githubService.js

import axios from "axios";
import logger from './logger.js'; 

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

const getWorkflowRuns = async () => {
  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs`,
      {
        headers: { Authorization: `token ${githubToken}` },
      }
    );
    return response.data.workflow_runs;
  } catch (error) {
    console.error("Error fetching workflow runs:", error.message);
    throw error;
  }
};

const calculateMTTR = async () => {
  const workflowRuns = await getWorkflowRuns();
  const failedRuns = workflowRuns.filter(run => run.conclusion === 'failure');
  const recoveryTimes = [];

  for (const failedRun of failedRuns) {
    const recoveryRun = workflowRuns.find(run => 
      new Date(run.created_at) > new Date(failedRun.created_at) && run.conclusion === 'success'
    );
    if (recoveryRun) {
      const recoveryTime = new Date(recoveryRun.created_at) - new Date(failedRun.created_at);
      recoveryTimes.push(recoveryTime);
    }
  }

  const averageMTTR = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;

  return averageMTTR / 1000; // Seconds
};

const calculateChangeFailureRate = async () => {
  const workflowRuns = await getWorkflowRuns();
  const totalDeployments = workflowRuns.length;
  const failedDeployments = workflowRuns.filter(run => run.conclusion === 'failure').length;
  const changeFailureRate = (failedDeployments / totalDeployments) * 100; // Percentage

  return changeFailureRate;
};

const calculateMetrics = async () => {
  const workflowRuns = await getWorkflowRuns();
  const deployments = workflowRuns.filter(run => run.conclusion === 'success');
  const deploymentFrequency = deployments.length / 30; // Assuming a 30-day period

  const leadTimes = [];
  for (const deployment of deployments) {
    const commitUrl = deployment.head_commit.url;
    const commitResponse = await axios.get(commitUrl, {
      headers: { Authorization: `token ${githubToken}` },
    });
    const commitTimestamp = commitResponse.data.commit.committer.date;
    const deploymentTimestamp = deployment.created_at;
    const leadTime = new Date(deploymentTimestamp) - new Date(commitTimestamp);
    leadTimes.push(leadTime);
  }

  const averageLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;
  const averageMTTR = await calculateMTTR();
  const changeFailureRate = await calculateChangeFailureRate();

  return {
    deploymentFrequency,
    averageLeadTime: averageLeadTime / 1000, // Seconds
    averageMTTR, // Seconds
    changeFailureRate // Percentage
  };
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
  getWorkflowRuns,
  calculateMetrics,
  updatePluginExtendedFile, 
};
