const Analytics = require('../models/Analytics');

const trackUsage = (tool) => async (req, res, next) => {
  try {
    await Analytics.findOneAndUpdate(
      {},
      {
        $inc: {
          totalRequests: 1,
          [`toolUsage.${tool}`]: 1
        }
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    // Silently fail - don't block the request
  }
  next();
};

module.exports = trackUsage;
