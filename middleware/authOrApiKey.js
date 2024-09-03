// middleware/authOrApiKey.js
import checkApiKey from './checkApiKey.js';
import { passport } from '../config/auth.js';

const authOrApiKey = (req, res, next) => {
  // Check if the user is authenticated via Azure AD
  if (req.isAuthenticated()) {
    return next();
  }

  // If not authenticated, check for API key
  return checkApiKey(req, res, next);
};

export default authOrApiKey;
