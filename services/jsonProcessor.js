import * as jsondiffpatch from "jsondiffpatch";
import axios from "axios";
import { config } from "../config/config.js";

/**
 * Extracts key-value pairs from a string.
 * @param {string} exp - The string to extract properties from.
 * @returns {Object} - An object containing the extracted properties.
 */
function extractProperties(exp) {
  const properties = {};
  const regex = /(\w+)\s*:=\s*([^,]+)(?=\s*,|\s*\)|$)/g;
  let match;

  while ((match = regex.exec(exp)) !== null) {
    const [_, key, value] = match;
    properties[key] = value;
  }

  return properties;
}

/**
 * Collects properties from JSON data into a set.
 * @param {Array} jsonData - The JSON data to collect properties from.
 * @returns {Object} - An object containing the collected properties.
 */
function collectProperties(jsonData) {
  const properties = {};

  jsonData.forEach((item) => {
    if (item.exp) {
      const itemProperties = extractProperties(item.exp);
      Object.entries(itemProperties).forEach(([key, value]) => {
        if (!properties[key]) {
          properties[key] = new Set();
        }
        properties[key].add(value);
      });
    }
  });

  return properties;
}

/**
 * Fetches content for missing dependencies from a source server.
 * @param {Object} missingDependencies - The missing dependencies to fetch content for.
 * @returns {Object} - An object containing the fetched content.
 */
async function fetchMissingDependenciesContent(missingDependencies) {
  const fetchedContent = {};

  for (const [property, items] of Object.entries(missingDependencies)) {
    if (items) {
      for (const item of items) {
        try {
          const response = await axios.get(
            `${config.SOURCE_SERVER_BASE_URL}/${property}/${encodeURIComponent(item)}`,
            {
              auth: {
                username: process.env.SOURCE_SERVER_USERNAME,
                password: process.env.SOURCE_SERVER_PASSWORD,
              },
            }
          );
          fetchedContent[property] = fetchedContent[property] || {};
          fetchedContent[property][item] = response.data;
        } catch (error) {
          console.error(`Failed to fetch content for ${property}: ${item}`, error.message);
        }
      }
    }
  }

  return fetchedContent;
}

/**
 * Analyzes the differences between two JSON objects and logs the changes.
 * @param {Object} diff - The diff object.
 * @param {Object} changes - The changes object to update.
 * @param {Array} changeLogs - The array to store change logs.
 * @param {string} [parentPath=""] - The parent path for nested properties.
 * @param {number} [currentDepth=0] - The current depth of the nested properties.
 */
function analyzeDiff(diff, changes, changeLogs, parentPath = "", currentDepth = 0) {
  changes.depth = Math.max(changes.depth, currentDepth);

  for (let key in diff) {
    if (key === "_t") continue;

    const change = diff[key];
    const currentPath = parentPath ? `${parentPath}.${key}` : key;

    if (Array.isArray(change)) {
      if (change.length === 1) {
        changes.newEntries++;
        changeLogs.push({
          path: currentPath,
          before: null,
          after: change[0],
          type: "addition",
        });
      } else if (change.length === 3 && change[2] === 0) {
        changes.deletedEntries++;
        changeLogs.push({
          path: currentPath,
          before: change[0],
          after: null,
          type: "deletion",
        });
      } else {
        changes.modifiedEntries++;
        changes.valueChanges++;
        changeLogs.push({
          path: currentPath,
          before: change[0],
          after: change[1],
          type: "modification",
        });
      }
    } else if (typeof change === "object" && change !== null) {
      analyzeDiff(change, changes, changeLogs, currentPath, currentDepth + 1);
    }
  }
}

/**
 * Initializes the changes object.
 * @returns {Object} - The initialized changes object.
 */
function initializeChanges() {
  return {
    totalChanges: 0,
    newEntries: 0,
    deletedEntries: 0,
    modifiedEntries: 0,
    addedKeys: 0,
    removedKeys: 0,
    valueChanges: 0,
    depth: 0,
  };
}

/**
 * Finds missing dependencies between two JSON objects.
 * @param {Array} json1 - The first JSON object.
 * @param {Array} json2 - The second JSON object.
 * @returns {Object} - An object containing the missing dependencies.
 */
function findMissingDependencies(json1, json2) {
  const properties1 = collectProperties(json1);
  const properties2 = collectProperties(json2);
  const missingDependencies = {};

  Object.keys(properties2).forEach((key) => {
    if (properties1[key]) {
      const missing = [...properties2[key]].filter(
        (value) => !properties1[key].has(value)
      );
      if (missing.length > 0) {
        missingDependencies[key] = missing;
      }
    } else {
      missingDependencies[key] = [...properties2[key]];
    }
  });

  return missingDependencies;
}

/**
 * Calculates the total number of changes.
 * @param {Object} changes - The changes object.
 * @returns {number} - The total number of changes.
 */
function calculateTotalChanges(changes) {
  return changes.newEntries + changes.deletedEntries + changes.modifiedEntries;
}

/**
 * Processes the differences between two JSON objects.
 * @param {Array} json1 - The first JSON object.
 * @param {Array} json2 - The second JSON object.
 * @returns {Object} - An object containing the diff, patched object, changes, change logs, and missing dependencies.
 */
export async function processJsonData(json1, json2) {
  if (!Array.isArray(json1) || !Array.isArray(json2)) {
    throw new Error("Both json1 and json2 should be arrays.");
  }

  const diff = jsondiffpatch.diff(json1, json2);
  const patchedObj = JSON.parse(JSON.stringify(json1));
  jsondiffpatch.patch(patchedObj, diff);

  const changes = initializeChanges();
  const changeLogs = [];
  const missingDependencies = findMissingDependencies(json1, json2);

  const missingDependenciesContent = await fetchMissingDependenciesContent(missingDependencies);

  analyzeDiff(diff, changes, changeLogs);

  changes.totalChanges = calculateTotalChanges(changes);

  return {
    diff,
    patchedObj,
    changes,
    changeLogs,
    missingDependencies: {
      ...missingDependencies,
      ...missingDependenciesContent,
    },
  };
}
