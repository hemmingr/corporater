// middleware/auth.js
import { passport } from '../config/auth.js';
import checkApiKey from './checkApiKey.js';

const ensureAuthenticatedWithApiKey = (req, res, next) => {
  // First, check for Azure AD authentication
  passport.authenticate('azuread-openidconnect', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (user) {
      // User authenticated with Azure AD
      return next();
    }

    // If Azure AD authentication fails, check API key
    checkApiKey(req, res, next);
  })(req, res, next);
};

export default ensureAuthenticatedWithApiKey;
