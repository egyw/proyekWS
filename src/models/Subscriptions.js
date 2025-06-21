const mongoose = require("mongoose");

const SubscriptionsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Subscriptions", SubscriptionsSchema);
