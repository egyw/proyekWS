const express = require("express");
const {
  getAllUsers,
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  verifyOTP,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/getAllUsers", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verifyOtp", verifyOTP)
router.get("/token", refreshToken);
router.delete("/logout", [verifyToken], logoutUser);
router.get("/profile", [verifyToken], getUserProfile);

module.exports = router;
