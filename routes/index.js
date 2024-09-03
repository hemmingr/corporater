import express from 'express';
import path from 'path';
import dns from 'dns';
import { fileURLToPath } from 'url';
import githubRoutes from './githubRoutes.js';
import apiRoutes from './apiRoutes.js';
import { passport } from '../config/auth.js';
import checkDomain from '../middleware/checkDomain.js'; // Import the middleware
import { ensureAuthenticated } from '../middleware/index.js'; // Import ensureAuthenticated

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

let serverIpInfo = null;

router.use('/github', githubRoutes);
router.use('/api', apiRoutes);

router.get('/login', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }));

router.get('/auth/callback', passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }), checkDomain, (req, res) => {
  res.redirect('/');
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Add the profile route
router.get('/profile', ensureAuthenticated, (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.redirect('/login');
  }
});

router.get('/idprocessor', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'idprocessor.html'));
});

router.get('/view-config', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'view-config.html'));
});

router.get('/file-structure', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'file-structure.html'));
});

router.get('/uptime', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'uptime.html'));
});

router.get('/compare', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'compare.html'));
});

router.get('/', (req, res) => {
  res.send('Welcome to the Corporater API service');
});

router.get('/server-info', (req, res) => {
  if (serverIpInfo) {
    res.json(serverIpInfo);
  } else {
    res.status(500).json({ error: 'Unable to fetch server IP information' });
  }
});

router.get('/client-info', (req, res) => {
  const clientIp = req.ip;
  dns.reverse(clientIp, (err, hostnames) => {
    if (err) {
      res.status(500).json({ error: 'Unable to perform reverse DNS lookup' });
    } else {
      res.json({ ip: clientIp, hostnames });
    }
  });
});

router.get('/credentials', ensureAuthenticated, (req, res) => {
    res.json({
        username: process.env.SOURCE_SERVER_USERNAME,
        password: process.env.SOURCE_SERVER_PASSWORD
    });
});

router.get('/logs', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'logs.html'));
});

export default router;
