const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "REGISTER",
        "LOGIN_OTP_DIKIRIM",
        "LOGIN_GAGAL",
        "LOGIN_BERHASIL",
        "LOGOUT",
        "GANTI_PASSWORD",
        "GANTI_EMAIL_REQUEST",
        "GANTI_EMAIL_GAGAL",
        "GANTI_EMAIL_BERHASIL",
        "REFRESH_TOKEN",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["BERHASIL", "GAGAL"],
    },
    ipAddress: {
      type: String,
      required: false,
    },
    details: {
      type: String, 
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Log", logSchema, "logs");
