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
const { uploadSingleImage } = require("../utils/multer/multer");
const resizeImage = require("../middlewares/resizeImage");
const router = express.Router();

router.get("/getAllRecipes", getAllRecipe);
router.get("/getDetailRecipe/:id", getDetailRecipe);
router.get("/getRecipeByUser", [verifyToken], getRecipebyUser);
router.get("/getRecipeByIngredients", getRecipeByIngredients);
router.get("/getRecipeByNutrients", getRecipeByNutrients);
router.post(
  "/insertRecipe",
  [verifyToken, uploadSingleImage("foodImage")],
  insertRecipe
);
router.put(
  "/updateRecipe/:id",
  [verifyToken, uploadSingleImage("foodImage")],
  updateRecipe
);
router.delete("/deleteRecipe/:id", [verifyToken], deleteRecipe);
module.exports = router;
