// middleware/checkDomain.js
export default (req, res, next) => {
  const allowedDomains = ['dynalab.no', 'corporater.com'];
  const userDomain = req.user._json.preferred_username.split('@')[1];

  if (allowedDomains.includes(userDomain)) {
    return next();
  } else {
    res.status(403).send('Access denied: Your domain is not allowed.');
  }
};
