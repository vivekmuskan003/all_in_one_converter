const jwt = require('jsonwebtoken');
const Analytics = require('../models/Analytics');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
};

exports.getDashboard = async (req, res) => {
  try {
    let analytics = await Analytics.findOne();
    if (!analytics) {
      analytics = {
        totalRequests: 0,
        toolUsage: { audio: 0, video: 0, document: 0, image: 0, compression: 0 }
      };
    }
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
