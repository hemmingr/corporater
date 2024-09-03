// middleware/checkApiKey.js
import dotenv from 'dotenv';
dotenv.config();

const checkApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key' });
  }

  next();
};

export default checkApiKey;
