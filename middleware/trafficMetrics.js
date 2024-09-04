// middleware/trafficMetrics.js
import { incrementRequestCount } from '../services/trafficMetricsService.js';

const trackRequests = (req, res, next) => {
  incrementRequestCount();
  next();
};

export default trackRequests;
