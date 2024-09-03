import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 }); // Cache TTL set to 24 hours (86400 seconds)

const fetchAzureIpRanges = async () => {
  const cachedIpRanges = cache.get('azureIpRanges');
  if (cachedIpRanges) {
    console.log('Returning cached Azure IP ranges');
    return cachedIpRanges;
  }

  try {
    const response = await axios.get('https://www.microsoft.com/en-us/download/confirmation.aspx?id=56519');
    // Parse the response to extract IP ranges
    const ipRanges = parseIpRanges(response.data);
    cache.set('azureIpRanges', ipRanges);
    return ipRanges;
  } catch (err) {
    console.error('Error fetching Azure IP ranges:', err);
    return [];
  }
};

const parseIpRanges = (data) => {
  // Implement parsing logic based on the response format
  // This is a placeholder function
  return ['52.233.190.0/24', '52.123.138.0/24', '52.112.103.0/24'];
};

export { fetchAzureIpRanges };

