const Analytics = require('../models/Analytics');

const trackUsage = (tool) => async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    await Analytics.findOneAndUpdate(
      {},
      {
        $inc: {
          totalRequests: 1,
          [`toolUsage.${tool}`]: 1,
        },
      },
      { upsert: true, new: true }
    );

    // Upsert the daily entry for today + this tool
    await Analytics.updateOne(
      { 'daily.date': today, 'daily.tool': tool },
      { $inc: { 'daily.$.count': 1 } }
    ).then(async (result) => {
      if (result.matchedCount === 0) {
        await Analytics.updateOne(
          {},
          { $push: { daily: { date: today, tool, count: 1 } } }
        );
      }
    });
  } catch {
    // Silently fail — never block the request
  }
  next();
};

module.exports = trackUsage;
