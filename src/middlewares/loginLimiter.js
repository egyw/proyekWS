const FailedLoginAttempt = require('../models/FailedLoginAttempt');
const IpBan = require('../models/IpBan');
const { calculateRemainingTime } = require('../utils/helpers/timeHelper');

const loginLimiter = async (req, res, next) => {
  const { identifier } = req.body;
  const ipAddress = req.ip;

  if (!identifier) {
    return next();
  }

  try {
    const ipBanRecord = await IpBan.findOne({ ipAddress });
    if (ipBanRecord && ipBanRecord.isBanned) {
      return res.status(403).json({
        message: "Akses ditolak. IP Anda telah diblokir karena aktivitas mencurigakan.",
      });
    }

    const attemptRecord = await FailedLoginAttempt.findOne({ 
      $or: [{ identifier }, { ipAddress }],
      lockUntil: { $gt: Date.now() } 
    });

    const lockRecord = await FailedLoginAttempt.findOne({ identifier, ipAddress });

    if (lockRecord && lockRecord.lockUntil && lockRecord.lockUntil > Date.now()) {
      const remainingTime = calculateRemainingTime(lockRecord.lockUntil);
      return res.status(429).json({ 
        message: `Terlalu banyak percobaan. Silakan coba lagi dalam ${remainingTime}.`,
      });
    }

    next();

  } catch (error) {
    console.error("Error di login limiter middleware:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat memvalidasi percobaan login.",
      error: error.message
    });
  }
};

module.exports = loginLimiter;