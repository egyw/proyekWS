const express = require("express");
const {
  getAllUsers,
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  verifyOTP,
  updateProfilePicture,
  getUserProfilePicture,
  deleteProfilePicture,
  updatePassword,
  verifyEmailOTP,
  updateEmail,
  getUserLogs,
  updateUserRole,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");
const { uploadSingleImage } = require("../utils/multer/multer");
const resizeImage = require("../middlewares/resizeImage");
const authorize = require("../middlewares/allowedRole");
const loginLimiter = require("../middlewares/loginLimiter");
const router = express.Router();

router.get("/getAllUsers", [verifyToken, authorize('admin')], getAllUsers);
router.post("/register", registerUser);
router.post("/login", [loginLimiter], loginUser);
router.post("/verifyLoginOtp", [loginLimiter], verifyOTP)
router.get("/token", refreshToken);
router.delete("/logout", logoutUser);
router.get("/logs/:userId", [verifyToken, authorize('admin')], getUserLogs);
router.patch("/role/:userId", [verifyToken, authorize('admin')], updateUserRole);
router.get("/profile", [verifyToken], getUserProfile);
router.patch("/profile/password", [verifyToken], updatePassword);
router.post("/profile/email", [verifyToken], updateEmail);
router.post("/profile/verifyEmailOtp", [verifyToken], verifyEmailOTP);
router.get("/profile/picture", [verifyToken], getUserProfilePicture);
router.delete("/profile/picture", [verifyToken], deleteProfilePicture);
router.post("/profile/upload", [verifyToken, uploadSingleImage('profilePicture'), resizeImage], updateProfilePicture)

module.exports = router;
