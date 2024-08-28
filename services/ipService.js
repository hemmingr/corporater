import axios from "axios";

const fetchIpInfo = async () => {
  try {
    const response = await axios.get("https://ipinfo.io/json");
    return response.data;
  } catch (error) {
    console.error("Error fetching IP information:", error);
    return null;
  }
};

export default fetchIpInfo;
