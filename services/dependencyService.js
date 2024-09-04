// services/dependencyService.js

import axios from "axios";
import { config } from "../config/config.js";

async function checkDependency(dependencyType, dependencyId) {
  try {
    const response = await axios.get(
      `https://target-server-url/api/${dependencyType}/${dependencyId}`
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Dependency does not exist
    }
    console.error(`Error checking ${dependencyType} on target:`, error);
    throw error;
  }
}

async function resolveDependency(entityType, dependencyType, dependencyId) {
  const dependency = await checkDependency(dependencyType, dependencyId);
  if (!dependency) {
    const sourceDependency = await fetchDependencyFromSource(
      dependencyType,
      dependencyId
    );
    await createDependencyOnTarget(dependencyType, sourceDependency);
  }
}

async function fetchDependencyFromSource(dependencyType, dependencyId) {
  try {
    const response = await axios.get(
      `${config.sourceServerBaseUrl}/api/${dependencyType}/${dependencyId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${dependencyType} from source:`, error);
    throw error;
  }
}

async function createDependencyOnTarget(dependencyType, dependencyData) {
  try {
    const response = await axios.post(
      `https://target-server-url/api/${dependencyType}`,
      dependencyData
    );
    return response.data;
  } catch (error) {
    console.error(`Error creating ${dependencyType} on target:`, error);
    throw error;
  }
}

export { resolveDependency };
