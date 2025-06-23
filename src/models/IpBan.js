const mongoose = require("mongoose");

const ipBanSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  timeoutHistory: {
    type: [Date],
    default: [],
  },
  reason: {
    type: String,
    default: "Terlalu banyak percobaan login gagal."
  }
}, { timestamps: true });

module.exports = mongoose.model('IpBan', ipBanSchema, 'ipBan');