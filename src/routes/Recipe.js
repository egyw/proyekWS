const express = require("express");
const {
  getAllRecipe,
  getDetailRecipe,
  insertRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeByIngredients,
  getRecipeByNutrients,
  getRecipebyUser,
} = require("../controllers/recipeController");
const verifyToken = require("../middlewares/authMiddleware");
const {
  uploadSingleImage,
  uploadSingleVideo,
  uploadImageAndVideo,
  uploadMultipleImageAndVideo,
} = require("../utils/multer/multer");
const resizeImage = require("../middlewares/resizeImage");
const router = express.Router();

router.get("/getAllRecipes", getAllRecipe);
router.get("/getDetailRecipe/:id", getDetailRecipe);
router.get("/getRecipeByUser", [verifyToken], getRecipebyUser);
router.get("/getRecipeByIngredients", getRecipeByIngredients);
router.get("/getRecipeByNutrients", getRecipeByNutrients);
router.post(
  "/insertRecipe",
  [verifyToken, uploadImageAndVideo()],
  insertRecipe
);
router.put(
  "/updateRecipe/:id",
  [verifyToken, uploadImageAndVideo()],
  updateRecipe
);
router.delete("/deleteRecipe/:id", [verifyToken], deleteRecipe);
module.exports = router;
