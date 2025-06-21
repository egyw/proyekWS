const { Recipe, User } = require("../models");
const { recipeValidation } = require("../utils/validations/RecipeValidation");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// =========================================================================================================================

const getAllRecipe = async (req, res) => {
  try {
    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/complexSearch",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        number: 12,
        addRecipeInformation: true,
        fillIngredients: true,
        addRecipeNutrition: true,
        sort: "popularity",
      },
    };

    const response = await axios(options);

    if (!response.data || !response.data.results) {
      return res
        .status(404)
        .json({ message: "No recipes found from external API" });
    }

    const externalRecipes = response.data.results;

    if (externalRecipes.length === 0) {
      return res.status(404).json({ message: "No recipes found" });
    } // Transform data dari API eksternal ke format database lokal
    const transformedRecipes = externalRecipes.map((recipe) => ({
      _id: recipe.id, // Gunakan ID dari Spoonacular sebagai _id
      title: recipe.title,
      servings: recipe.servings || 1,
      readyInMinutes: recipe.readyInMinutes || 30,
      preparationMinutes: Math.floor((recipe.readyInMinutes || 30) * 0.4), // Estimasi 40% dari total waktu
      cookingMinutes: Math.floor((recipe.readyInMinutes || 30) * 0.6), // Estimasi 60% dari total waktu
      ingredients:
        recipe.extendedIngredients?.map((ing) => ({
          name: ing.name,
          measure: `${ing.amount} ${ing.unit}`.trim(),
        })) || [],
      dishTypes: recipe.dishTypes?.join(", ") || "main course",
      tags: recipe.diets?.join(", ") || "healthy",
      area: recipe.cuisines?.join(", ") || "international",
      instructions:
        recipe.instructions ||
        "Instructions not available from external source",
      video: null,
      createdByUser: null,
      dateModified: null,
      image: recipe.image,
      healthScore: recipe.healthScore || 50,
      summary:
        recipe.summary?.replace(/<[^>]*>/g, "") || "No summary available",
      weightWatcherSmartPoints:
        recipe.weightWatcherSmartPoints || Math.floor(Math.random() * 20),
      calories:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Calories")
          ?.amount || Math.floor(Math.random() * 500 + 200),
      carbs:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Carbohydrates")
          ?.amount || Math.floor(Math.random() * 50 + 10) + " g",
      fat:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Fat")?.amount ||
        Math.floor(Math.random() * 30 + 5) + " g",
      protein:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Protein")
          ?.amount || Math.floor(Math.random() * 40 + 10) + " g",
    }));

    return res.status(200).json(transformedRecipes);
  } catch (error) {
    console.error("Error fetching recipes from external API:", error.message);
    // Jika API eksternal gagal, fallback ke database lokal
    try {
      const localRecipes = await Recipe.find().limit(12);

      if (localRecipes.length === 0) {
        return res.status(404).json({
          message: "No recipes found in database and external API failed",
        });
      }

      return res.status(200).json(localRecipes);
    } catch (dbError) {
      return res.status(500).json({
        message: "Both external API and database failed",
        error: error.message,
      });
    }
  }
};

// =========================================================================================================================

const getDetailRecipe = async (req, res) => {
  const id = req.params.id;

  try {
    if (!id || String(id).trim() === "") {
      return res.status(400).json({ message: "ID harus diisi" });
    }

    const options = {
      method: "GET",
      url: `https://api.spoonacular.com/recipes/${id}/information`,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        includeNutrition: true,
        addRecipeInformation: true,
        fillIngredients: true,
        addRecipeNutrition: true,
      },
    };
    const response = await axios(options);

    if (!response.data) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    const recipe = response.data;

    const transformedRecipe = {
      _id: recipe.id,
      title: recipe.title,
      servings: recipe.servings || 1,
      readyInMinutes: recipe.readyInMinutes || 30,
      preparationMinutes:
        recipe.preparationMinutes ||
        Math.floor((recipe.readyInMinutes || 30) * 0.4),
      cookingMinutes:
        recipe.cookingMinutes ||
        Math.floor((recipe.readyInMinutes || 30) * 0.6),
      ingredients:
        recipe.extendedIngredients?.map((ing) => ({
          name: ing.name,
          measure: `${ing.amount} ${ing.unit}`.trim(),
        })) || [],
      dishTypes: recipe.dishTypes?.join(", ") || "main course",
      tags:
        [...(recipe.diets || []), ...(recipe.cuisines || [])].join(", ") ||
        "healthy",
      area: recipe.cuisines?.join(", ") || "international",
      instructions:
        recipe.instructions?.replace(/<[^>]*>/g, "") ||
        "Instructions not available from external source",
      video: null,
      createdByUser: null,
      dateModified: null,
      image: recipe.image,
      healthScore: recipe.healthScore || 50,
      summary:
        recipe.summary?.replace(/<[^>]*>/g, "") || "No summary available",
      weightWatcherSmartPoints:
        recipe.weightWatcherSmartPoints || Math.floor(Math.random() * 20),
      calories:
        recipe.nutrition?.nutrients?.find((n) => n.name === "Calories")
          ?.amount || Math.floor(Math.random() * 500 + 200),
      carbs:
        (recipe.nutrition?.nutrients?.find((n) => n.name === "Carbohydrates")
          ?.amount || Math.floor(Math.random() * 50 + 10)) + " g",
      fat:
        (recipe.nutrition?.nutrients?.find((n) => n.name === "Fat")?.amount ||
          Math.floor(Math.random() * 30 + 5)) + " g",
      protein:
        (recipe.nutrition?.nutrients?.find((n) => n.name === "Protein")
          ?.amount || Math.floor(Math.random() * 40 + 10)) + " g",
    };

    return res.status(200).json(transformedRecipe);
  } catch (error) {
    console.error(
      "Error fetching recipe detail from external API:",
      error.message
    );

    try {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        const localRecipe = await Recipe.findById(id);

        if (localRecipe) {
          return res.status(200).json(localRecipe);
        }
      }

      return res.status(404).json({ message: "Recipe not found" });
    } catch (dbError) {
      return res.status(500).json({
        message: "Both external API and database failed",
        error: error.message,
      });
    }
  }
};

// =========================================================================================================================

const getRecipebyUser = async (req, res) => {
  try {
    let targetUser;

    if (req.body.username) {
      targetUser = await User.findOne({
        username: req.body.username,
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "Pengguna tidak ditemukan",
        });
      }
    } else {
      targetUser = await User.findOne({
        username: req.user.username,
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User dari token tidak ditemukan",
        });
      }
    }

    const userRecipes = await Recipe.find({
      createdByUser: targetUser._id,
    });

    if (!userRecipes || userRecipes.length === 0) {
      return res.status(200).json({
        success: true,
        message: `Tidak ada resep ditemukan untuk pengguna ${targetUser.username}`,
        data: [],
        user: {
          username: targetUser.username,
          id: targetUser._id,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Berhasil mendapatkan ${userRecipes.length} resep dari ${targetUser.username}`,
      data: userRecipes,
      user: {
        username: targetUser.username,
        id: targetUser._id,
      },
    });
  } catch (error) {
    console.error("Error getting user recipes:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mendapatkan resep pengguna",
      error: error.message,
    });
  }
};

// =========================================================================================================================
const getRecipeByIngredients = async (req, res) => {
  try {
    const { ingredients } = req.query;

    if (!ingredients || ingredients.trim() === "") {
      return res
        .status(400)
        .json({ message: "Ingredients parameter is required" });
    }

    // Configuration untuk API Spoonacular - Find by Ingredients
    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/findByIngredients",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        ingredients: ingredients,
        number: 12,
        ranking: 1,
        ignorePantry: true,
      },
    };

    const response = await axios(options);

    if (!response.data || response.data.length === 0) {
      return res
        .status(404)
        .json({ message: "No recipes found with those ingredients" });
    }

    const recipes = response.data;

    // Transform data dari API eksternal ke format database lokal
    const transformedRecipes = recipes.map((recipe) => ({
      _id: recipe.id,
      title: recipe.title,
      servings: null, // Data detail tidak tersedia di endpoint ini
      readyInMinutes: null,
      preparationMinutes: null,
      cookingMinutes: null,
      ingredients: [
        ...(recipe.usedIngredients?.map((ing) => ({
          name: ing.name,
          measure: `${ing.amount} ${ing.unit}`.trim(),
        })) || []),
        ...(recipe.missedIngredients?.map((ing) => ({
          name: ing.name + " (missing)",
          measure: `${ing.amount} ${ing.unit}`.trim(),
        })) || []),
      ],
      dishTypes: null,
      tags: "ingredient-based",
      area: "international",
      instructions: "Use getDetailRecipe endpoint to get full instructions",
      video: null,
      createdByUser: null,
      dateModified: null,
      image: recipe.image,
      healthScore: null,
      summary: `Recipe using ${recipe.usedIngredientCount} of your ingredients. Missing ${recipe.missedIngredientCount} ingredients.`,
      weightWatcherSmartPoints: null,
      calories: null,
      carbs: null,
      fat: null,
      protein: null,
      // Additional info specific to ingredient-based search
      usedIngredientCount: recipe.usedIngredientCount,
      missedIngredientCount: recipe.missedIngredientCount,
      likes: recipe.likes,
    }));

    return res.status(200).json(transformedRecipes);
  } catch (error) {
    console.error("Error searching recipes by ingredients:", error.message);

    // Fallback ke database lokal dengan text search
    try {
      const searchTerms = req.query.ingredients
        .split(",")
        .map((term) => term.trim());
      const regexPattern = searchTerms.map((term) => `(?=.*${term})`).join("");

      const localRecipes = await Recipe.find({
        $or: [
          { "ingredients.name": { $regex: new RegExp(regexPattern, "i") } },
          { tags: { $regex: new RegExp(regexPattern, "i") } },
          { title: { $regex: new RegExp(regexPattern, "i") } },
        ],
      }).limit(12);

      if (localRecipes.length === 0) {
        return res
          .status(404)
          .json({ message: "No recipes found with those ingredients" });
      }

      return res.status(200).json(localRecipes);
    } catch (dbError) {
      return res.status(500).json({
        message: "Both external API and database search failed",
        error: error.message,
      });
    }
  }
};

// =========================================================================================================================

const getRecipeByNutrients = async (req, res) => {
  try {
    const {
      minCalories,
      maxCalories,
      minProtein,
      maxProtein,
      minCarbs,
      maxCarbs,
      minFat,
      maxFat,
      minSugar,
      maxSugar,
      minFiber,
      maxFiber,
    } = req.query;

    const hasNutrientParams =
      minCalories ||
      maxCalories ||
      minProtein ||
      maxProtein ||
      minCarbs ||
      maxCarbs ||
      minFat ||
      maxFat ||
      minSugar ||
      maxSugar ||
      minFiber ||
      maxFiber;

    if (!hasNutrientParams) {
      return res.status(400).json({
        message:
          "At least one nutrient parameter is required: minCalories, maxCalories, minProtein, maxProtein, minCarbs, maxCarbs, minFat, maxFat, minSugar, maxSugar, minFiber, maxFiber",
      });
    }

    // Configuration untuk API Spoonacular - Find by Nutrients
    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/findByNutrients",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        number: 12, // Jumlah resep yang diambil
        ...(minCalories && { minCalories }),
        ...(maxCalories && { maxCalories }),
        ...(minProtein && { minProtein }),
        ...(maxProtein && { maxProtein }),
        ...(minCarbs && { minCarbs }),
        ...(maxCarbs && { maxCarbs }),
        ...(minFat && { minFat }),
        ...(maxFat && { maxFat }),
        ...(minSugar && { minSugar }),
        ...(maxSugar && { maxSugar }),
        ...(minFiber && { minFiber }),
        ...(maxFiber && { maxFiber }),
      },
    };

    // Menggunakan axios untuk mencari recipe berdasarkan nutrients
    const response = await axios(options);

    if (!response.data || response.data.length === 0) {
      return res.status(404).json({
        message: "No recipes found with the specified nutritional criteria",
      });
    }

    const recipes = response.data;

    // Transform data dari API eksternal ke format database lokal
    const transformedRecipes = recipes.map((recipe) => ({
      _id: recipe.id,
      title: recipe.title,
      servings: recipe.servings || null,
      readyInMinutes: recipe.readyInMinutes || null,
      preparationMinutes:
        recipe.preparationMinutes ||
        Math.floor((recipe.readyInMinutes || 30) * 0.4),
      cookingMinutes:
        recipe.cookingMinutes ||
        Math.floor((recipe.readyInMinutes || 30) * 0.6),
      ingredients: [], // Data ingredients tidak tersedia di endpoint nutrients
      dishTypes: recipe.dishTypes?.join(", ") || null,
      tags:
        [...(recipe.diets || []), "nutrient-based"].join(", ") ||
        "healthy, nutrient-filtered",
      area: recipe.cuisines?.join(", ") || "international",
      instructions:
        "Use getDetailRecipe endpoint to get full instructions and ingredients",
      video: null,
      createdByUser: null,
      dateModified: null,
      image: recipe.image,
      healthScore: recipe.healthScore || null,
      summary:
        recipe.summary?.replace(/<[^>]*>/g, "") ||
        `Recipe found based on nutritional criteria - ${
          recipe.calories || "N/A"
        } calories`,
      weightWatcherSmartPoints: recipe.weightWatcherSmartPoints || null,
      calories: recipe.calories || null,
      carbs: recipe.carbs ? recipe.carbs + " g" : null,
      fat: recipe.fat ? recipe.fat + " g" : null,
      protein: recipe.protein ? recipe.protein + " g" : null,
      // Additional nutritional info if available
      ...(recipe.sugar && { sugar: recipe.sugar + " g" }),
      ...(recipe.fiber && { fiber: recipe.fiber + " g" }),
      ...(recipe.sodium && { sodium: recipe.sodium + " mg" }),
      // Search criteria info
      searchCriteria: {
        ...(minCalories && { minCalories }),
        ...(maxCalories && { maxCalories }),
        ...(minProtein && { minProtein }),
        ...(maxProtein && { maxProtein }),
        ...(minCarbs && { minCarbs }),
        ...(maxCarbs && { maxCarbs }),
        ...(minFat && { minFat }),
        ...(maxFat && { maxFat }),
      },
    }));

    return res.status(200).json(transformedRecipes);
  } catch (error) {
    console.error("Error searching recipes by nutrients:", error.message);

    // Fallback ke database lokal dengan filter berdasarkan range nutrients
    try {
      let query = {};

      // Build query untuk range nutrients (jika ada field numeric di database)
      if (req.query.minCalories || req.query.maxCalories) {
        query.calories = {};
        if (req.query.minCalories)
          query.calories.$gte = parseInt(req.query.minCalories);
        if (req.query.maxCalories)
          query.calories.$lte = parseInt(req.query.maxCalories);
      }

      const localRecipes = await Recipe.find(query).limit(12);

      if (localRecipes.length === 0) {
        return res.status(404).json({
          message: "No recipes found with the specified nutritional criteria",
        });
      }

      return res.status(200).json(localRecipes);
    } catch (dbError) {
      return res.status(500).json({
        message: "Both external API and database search failed",
        error: error.message,
      });
    }
  }
};

// =========================================================================================================================

const insertRecipe = async (req, res) => {
  try {
    // Ambil user ID dari JWT token
    const userId = req.user.id || req.user._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID tidak ditemukan dari token",
      });
    }

    req.body.createdByUser = userId;

    // Processing tags
    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = req.body.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .join(", ");
    }

    // Processing ingredients
    if (req.body.ingredients && typeof req.body.ingredients === "string") {
      req.body.ingredients = req.body.ingredients
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)
        .map((ingredient) => {
          const parts = ingredient.split(":");
          return {
            name: parts[0]?.trim() || ingredient,
            measure: parts[1]?.trim() || "secukupnya",
          };
        });
    }
    // Processing ingredients
    if (req.body.ingredients && typeof req.body.ingredients === "string") {
      req.body.ingredients = req.body.ingredients
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)
        .map((ingredient) => {
          const parts = ingredient.split(":");
          return {
            name: parts[0]?.trim() || ingredient,
            measure: parts[1]?.trim() || "secukupnya",
          };
        });
    }

    if (req.file) {
      console.log("📁 Single file detected:", req.file);

      // Cek tipe file berdasarkan fieldname atau mimetype
      if (
        req.file.fieldname === "foodImage" ||
        req.file.mimetype.startsWith("image/")
      ) {
        const imagePath = `/images/foodImages/${req.file.filename}`;
        req.body.image = imagePath;
        req.body.video = null; // Set video ke null jika upload image
        console.log("✅ Image uploaded:", req.body.image);
      } else if (
        req.file.fieldname === "foodVideo" ||
        req.file.mimetype.startsWith("video/")
      ) {
        const videoPath = `videos/foodVideos/${req.file.filename}`;
        req.body.video = videoPath;
        req.body.image = null; // Set image ke null jika upload video
        console.log("✅ Video uploaded:", req.body.video);
      } else {
        // Default ke image jika tidak bisa deteksi
        const imagePath = `images/foodImages/${req.file.filename}`;
        req.body.image = imagePath;
        req.body.video = null;
        console.log("✅ File uploaded as image (default):", req.body.image);
      }
    } else {
      console.log("❌ No file found in request");
      req.body.image = null;
      req.body.video = null;
    }

    const validated = await recipeValidation.validateAsync(req.body, {
      abortEarly: false,
    });

    if (!validated) {
      return res.status(400).json({
        success: false,
        message: "Validation failed!",
        error: "Invalid data. Please provide valid recipe details.",
      });
    }

    const newRecipe = new Recipe(validated);
    const savedRecipe = await newRecipe.save();

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully!",
      data: savedRecipe,
    });
  } catch (error) {
    console.error("Error in insertRecipe:", error);
    if (req.files) {
      const fs = require("fs");
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
    } else if (req.file) {
      const fs = require("fs");
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    if (error.isJoi) {
      const errorMessages = {};
      error.details.forEach((detail) => {
        errorMessages[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed!",
        error: errorMessages,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// =========================================================================================================================

const updateRecipe = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id || req.user._id;

    // Ambil resep yang akan diupdate
    const existingRecipe = await Recipe.findById(id);
    if (!existingRecipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Cek authorization: bandingkan createdByUser di database dengan ID user dari token
    if (existingRecipe.createdByUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this recipe",
      });
    }

    if (req.body.tags && typeof req.body.tags === "string") {
      req.body.tags = req.body.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .join(", ");
    }

    if (req.body.ingredients && typeof req.body.ingredients === "string") {
      req.body.ingredients = req.body.ingredients
        .split(",")
        .map((ingredient) => ingredient.trim())
        .filter((ingredient) => ingredient.length > 0)
        .map((ingredient) => {
          const parts = ingredient.split(":");
          return {
            name: parts[0]?.trim() || ingredient,
            measure: parts[1]?.trim() || "secukupnya",
          };
        });
    }

    const validated = await recipeValidation.validateAsync(req.body, {
      abortEarly: false,
    });

    // Set dateModified to current date when updating
    validated.dateModified = new Date();

    const updatedRecipe = await Recipe.findByIdAndUpdate(id, validated, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Recipe updated successfully!",
      data: updatedRecipe,
    });
  } catch (error) {
    if (req.files) {
      const fs = require("fs");
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
    } else if (req.file) {
      const fs = require("fs");
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    if (error.isJoi) {
      const errorMessages = {};
      error.details.forEach((detail) => {
        errorMessages[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        message: "Validation failed!",
        error: errorMessages,
      });
    }

    return res.status(500).json({ message: error.message });
  }
};

// =========================================================================================================================
const deleteRecipe = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id || req.user._id;

  try {
    // Ambil resep yang akan dihapus
    const existingRecipe = await Recipe.findById(id);
    if (!existingRecipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found",
      });
    }

    // Cek authorization
    if (existingRecipe.createdByUser.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this recipe",
      });
    }

    // Gunakan metode delete dari mongoose-delete (soft delete)
    // Ini akan set deleted=true, deletedAt=current date
    await existingRecipe.delete(userId);

    return res.status(200).json({
      success: true,
      message: "Recipe deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting recipe",
      error: error.message,
    });
  }
};

// =========================================================================================================================
module.exports = {
  getAllRecipe,
  getDetailRecipe,
  getRecipebyUser,
  updateRecipe,
  insertRecipe,
  deleteRecipe,
  getRecipeByIngredients,
  getRecipeByNutrients,
};
