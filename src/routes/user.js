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
} = require("../controllers/userController");
const verifyToken = require("../middlewares/authMiddleware");
const { uploadSingleImage } = require("../utils/multer/multer");
const resizeImage = require("../middlewares/resizeImage");
const router = express.Router();

router.get("/getAllUsers", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verifyOtp", verifyOTP)
router.get("/token", refreshToken);
router.delete("/logout", logoutUser);
router.get("/profile", [verifyToken], getUserProfile);
router.get("/profile/picture", [verifyToken], getUserProfilePicture);
router.delete("/profile/picture", [verifyToken], deleteProfilePicture);
router.post("/profile/upload", [verifyToken, uploadSingleImage('profilePicture'), resizeImage], updateProfilePicture)

module.exports = router;
