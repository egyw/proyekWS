const express = require("express");
const {
  getAllRecipe,
  getDetailRecipe,
  insertRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeByIngredients,
  getRecipeByNutrients,
} = require("../controllers/recipeController");
const verifyToken = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/getAllRecipes", getAllRecipe);
router.get("/getDetailRecipe/:id", getDetailRecipe);
router.get("/getRecipeByIngredients", getRecipeByIngredients);
router.get("/getRecipeByNutrients", getRecipeByNutrients);
router.post("/insertRecipe", [verifyToken], insertRecipe);
router.put("/updateRecipe/:id", [verifyToken], updateRecipe);
router.delete("/deleteRecipe/:id", [verifyToken], deleteRecipe);
module.exports = router;
