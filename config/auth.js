// config/auth.js
import passport from 'passport';
import { OIDCStrategy } from 'passport-azure-ad';

passport.use(new OIDCStrategy({
  identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.CLIENT_ID,
  responseType: 'code',
  responseMode: 'query',
  redirectUrl: 'https://corporater-deployment.glitch.me/auth/callback',
  clientSecret: process.env.CLIENT_SECRET,
  validateIssuer: false,
  passReqToCallback: false,
  scope: ['profile', 'offline_access', 'https://graph.microsoft.com/mail.read']
}, (iss, sub, profile, accessToken, refreshToken, done) => {
  // Handle user profile and tokens here
  done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

export { passport };
