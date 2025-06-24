const express = require("express");
const {
  getAllRecipe,
  getDetailRecipe,
  deleteRecipe,
  getRecipeByIngredients,
  getRecipeByNutrients,
  getRecipebyUser,
  insertRecipeWithMulter,
  insertRecipeWithCloud,
  updateRecipeWithCloud,
  updateRecipeWithMulter,
} = require("../controllers/recipeController");
const verifyToken = require("../middlewares/authMiddleware");
const {
  uploadSingleImage,
  uploadSingleVideo,
  uploadImageAndVideo,
  uploadMultipleImageAndVideo,
} = require("../utils/multer/multer");
const { uploadRecipeMedia } = require("../utils/cloudinary/cloudinary");
const resizeImage = require("../middlewares/resizeImage");
const router = express.Router();

router.get("/getAllRecipes", getAllRecipe);
router.get("/getDetailRecipe/:id", getDetailRecipe);
router.get("/getRecipeByUser", [verifyToken], getRecipebyUser);
router.get("/getRecipeByIngredients", getRecipeByIngredients);
router.get("/getRecipeByNutrients", getRecipeByNutrients);
router.post(
  "/insertRecipeWithCloud",
  [verifyToken, uploadRecipeMedia()],
  insertRecipeWithCloud
);
router.put(
  "/updateRecipeWithCloud/:id",
  [verifyToken, uploadRecipeMedia()],
  updateRecipeWithCloud
);
router.delete("/deleteRecipe/:id", [verifyToken], deleteRecipe);
module.exports = router;
