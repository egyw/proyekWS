const express = require("express");
const {
  getAllUsers,
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  verifyOTP,
  updatePassword,
  verifyEmailOTP,
  updateEmail,
  getUserLogs,
  updateUserRole,
  getUserProfilePictureMulter,
  getUserProfilePictureCloud,
  updateProfilePictureMulter,
  updateProfilePictureCloud,
  deleteProfilePictureCloud,
  deleteProfilePictureMulter,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");
const { uploadSingleImage } = require("../utils/multer/multer");
const resizeImage = require("../middlewares/resizeImage");
const authorize = require("../middlewares/allowedRole");
const loginLimiter = require("../middlewares/loginLimiter");
const { uploadProfileToCloud } = require("../utils/cloudinary/cloudinary");
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
router.get("/profile/picture/multer", [verifyToken], getUserProfilePictureMulter);
router.get("/profile/picture/cloud", [verifyToken], getUserProfilePictureCloud);
router.delete("/profile/picture/cloud", [verifyToken], deleteProfilePictureCloud);
router.delete("/profile/picture/multer", [verifyToken], deleteProfilePictureMulter);

// multer
router.post("/profile/upload/multer", [verifyToken, uploadSingleImage('profilePicture'), resizeImage], updateProfilePictureMulter) 

// cloudinary
router.post("/profile/upload/cloud", [verifyToken, uploadProfileToCloud.single('profilePicture')], updateProfilePictureCloud);
module.exports = router;
