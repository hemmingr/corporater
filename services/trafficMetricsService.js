let requestCount = 0;
const requestTimestamps = [];

const incrementRequestCount = () => {
  requestCount++;
  requestTimestamps.push(Date.now());
};

const getTrafficMetrics = () => {
  const now = Date.now();
  const requestsLastMinute = requestTimestamps.filter(
    (timestamp) => now - timestamp <= 60000
  ).length;
  return {
    requestCount,
    requestsLastMinute,
  };
};

export { incrementRequestCount, getTrafficMetrics };
