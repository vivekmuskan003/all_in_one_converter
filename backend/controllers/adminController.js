const jwt      = require('jsonwebtoken');
const Analytics = require('../models/Analytics');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
};

exports.getDashboard = async (req, res) => {
  try {
    let analytics = await Analytics.findOne();
    if (!analytics) {
      return res.json({
        totalRequests: 0,
        toolUsage: { audio: 0, video: 0, document: 0, image: 0, compression: 0 },
        daily: [],
      });
    }
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/stats?from=YYYY-MM-DD&to=YYYY-MM-DD&tool=audio
exports.getStats = async (req, res) => {
  try {
    const { from, to, tool } = req.query;
    const analytics = await Analytics.findOne();
    if (!analytics) return res.json({ daily: [], totals: {} });

    let daily = analytics.daily || [];

    // Filter by date range
    if (from) daily = daily.filter(d => d.date >= from);
    if (to)   daily = daily.filter(d => d.date <= to);

    // Filter by tool
    if (tool && tool !== 'all') daily = daily.filter(d => d.tool === tool);

    // Aggregate by date
    const byDate = {};
    for (const entry of daily) {
      if (!byDate[entry.date]) byDate[entry.date] = { date: entry.date, total: 0 };
      byDate[entry.date][entry.tool] = (byDate[entry.date][entry.tool] || 0) + entry.count;
      byDate[entry.date].total += entry.count;
    }

    // Sort by date ascending
    const result = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

    // Totals per tool in range
    const totals = {};
    for (const entry of daily) {
      totals[entry.tool] = (totals[entry.tool] || 0) + entry.count;
    }

    res.json({ daily: result, totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/reset  — reset all counters
exports.resetStats = async (req, res) => {
  try {
    await Analytics.deleteMany({});
    res.json({ message: 'Stats reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
