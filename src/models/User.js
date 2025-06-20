const mongoose  = require("mongoose");

const userSchema = new mongoose.Schema({
  profilePicture: {
    type: String,
    default: 'null', 
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  saldo: {
    type: Number,
    default: 0,
  },
  cart: {
    type: [
      {
        item_name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    default: [],
  },
  refreshToken: {
    type: String,
    default: null,
  },
  pendingEmail: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiresAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema, 'users');