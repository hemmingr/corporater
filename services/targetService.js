import axios from "axios";

async function fetchEntityFromTarget(entityType, entityId) {
  try {
    const response = await axios.get(
      `https://target-server-url/api/${entityType}/${entityId}`
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null; // Entity does not exist
    }
    console.error(`Error fetching ${entityType} from target:`, error);
    throw error;
  }
}

async function sendDataToTarget(entityType, entityData) {
  try {
    const response = await axios.post(
      `https://target-server-url/api/${entityType}`,
      entityData
    );
    return response.data;
  } catch (error) {
    console.error(`Error sending ${entityType} to target:`, error);
    throw error;
  }
}

export { fetchEntityFromTarget, sendDataToTarget };
