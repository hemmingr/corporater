import * as jsondiffpatch from "jsondiffpatch";
import axios from "axios";
import { config } from "./config.js";

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

export async function processJsonData(json1, json2) {
  const diff = jsondiffpatch.diff(json1, json2);
  const patchedObj = JSON.parse(JSON.stringify(json1));
  jsondiffpatch.patch(patchedObj, diff);

  const changes = {
    totalChanges: 0,
    newEntries: 0,
    deletedEntries: 0,
    modifiedEntries: 0,
    addedKeys: 0,
    removedKeys: 0,
    valueChanges: 0,
    depth: 0,
  };

  const changeLogs = [];
  const missingDependencies = {};

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

  const properties1 = collectProperties(json1);
  const properties2 = collectProperties(json2);

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

  const missingDependenciesContent = await fetchMissingDependenciesContent(
    missingDependencies
  );

  function analyzeDiff(diff, parentPath = "", currentDepth = 0) {
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
        analyzeDiff(change, currentPath, currentDepth + 1);
      }
    }
  }

  analyzeDiff(diff);

  changes.totalChanges =
    changes.newEntries + changes.deletedEntries + changes.modifiedEntries;

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

async function fetchMissingDependenciesContent(missingDependencies) {
  const fetchedContent = {};

  for (const [property, items] of Object.entries(missingDependencies)) {
    if (items) {
      for (const item of items) {
        try {
          const response = await axios.get(
            `${config.SOURCE_SERVER_BASE_URL}/${property}/${encodeURIComponent(
              item
            )}`,
            {
              auth: {
                username: process.env.SOURCE_SERVER_USERNAME, // Fetch from environment variable
                password: process.env.SOURCE_SERVER_PASSWORD, // Fetch from environment variable
              },
            }
          );
          fetchedContent[property] = fetchedContent[property] || {};
          fetchedContent[property][item] = response.data;
        } catch (error) {
          console.error(
            `Failed to fetch content for ${property}: ${item}`,
            error.message
          );
        }
      }
    }
  }

  return fetchedContent;
}
