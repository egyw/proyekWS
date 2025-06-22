const { Recipe, User } = require("../models");
const { recipeValidation } = require("../utils/validations/RecipeValidation");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

// =========================================================================================================================

const getAllRecipe = async (req, res) => {
  try {
    const number = parseInt(req.query.number) || 12;

    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/complexSearch",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        addRecipeInformation: true,
        fillIngredients: true,
        addRecipeNutrition: true,
        sort: "_id",
        sortDirection: "desc",
        number: number,
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

    // Check if ID is a valid MongoDB ObjectId (24 hex chars)
    const isMongoDbId = /^[0-9a-fA-F]{24}$/.test(id);

    if (isMongoDbId) {
      // Try to fetch from local database first
      const localRecipe = await Recipe.findById(id);
      if (localRecipe) {
        return res.status(200).json(localRecipe);
      }
    }

    // If not a MongoDB ID or recipe not found in DB, try external API
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
    console.error("Error fetching recipe detail:", error.message);

    // One last attempt to check local DB if we haven't already
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      try {
        const localRecipe = await Recipe.findById(id);
        if (localRecipe) {
          return res.status(200).json(localRecipe);
        }
      } catch (dbError) {
        console.error("Database error:", dbError.message);
      }
    }

    return res.status(404).json({ message: "Recipe not found in any source" });
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

    // Search in local database first
    const searchTerms = ingredients.split(",").map((term) => term.trim());
    const regexPattern = searchTerms.map((term) => `(?=.*${term})`).join("");

    const localRecipes = await Recipe.find({
      $or: [
        { "ingredients.name": { $regex: new RegExp(regexPattern, "i") } },
        { tags: { $regex: new RegExp(regexPattern, "i") } },
        { title: { $regex: new RegExp(regexPattern, "i") } },
      ],
    }).limit(6);

    // Configuration for API Spoonacular - Find by Ingredients
    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/findByIngredients",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        ingredients: ingredients,
        number: 6, // Reduced to combine with local recipes
        ranking: 1,
        ignorePantry: true,
      },
    };

    const response = await axios(options);
    let externalRecipes = [];

    if (response.data && response.data.length > 0) {
      // Get detailed information for each recipe
      const detailedRecipes = await Promise.all(
        response.data.map(async (recipe) => {
          try {
            const detailOptions = {
              method: "GET",
              url: `https://api.spoonacular.com/recipes/${recipe.id}/information`,
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.SPOONACULAR_API_KEY,
              },
              params: {
                includeNutrition: true,
              },
            };

            const detailResponse = await axios(detailOptions);
            return { ...recipe, details: detailResponse.data };
          } catch (error) {
            console.error(
              `Error fetching details for recipe ${recipe.id}:`,
              error.message
            );
            return recipe;
          }
        })
      );

      externalRecipes = detailedRecipes.map((recipe) => ({
        _id: recipe.id,
        title: recipe.title,
        servings: recipe.details?.servings || 4,
        readyInMinutes: recipe.details?.readyInMinutes || 30,
        preparationMinutes:
          recipe.details?.preparationMinutes ||
          Math.floor((recipe.details?.readyInMinutes || 30) * 0.4),
        cookingMinutes:
          recipe.details?.cookingMinutes ||
          Math.floor((recipe.details?.readyInMinutes || 30) * 0.6),
        ingredients: [
          ...(recipe.usedIngredients?.map((ing) => ({
            name: ing.name,
            measure: `${ing.amount} ${ing.unit}`.trim(),
            used: true,
          })) || []),
          ...(recipe.missedIngredients?.map((ing) => ({
            name: ing.name,
            measure: `${ing.amount} ${ing.unit}`.trim(),
            missing: true,
          })) || []),
        ],
        dishTypes: recipe.details?.dishTypes?.join(", ") || "main course",
        tags:
          recipe.details?.diets?.join(", ") ||
          `ingredient-based, ${recipe.usedIngredientCount} ingredients used`,
        area: recipe.details?.cuisines?.join(", ") || "international",
        instructions:
          recipe.details?.instructions?.replace(/<[^>]*>/g, "") ||
          `Recipe made with ${recipe.usedIngredientCount} ingredients you have.`,
        video: null,
        createdByUser: null,
        dateModified: null,
        image: recipe.image,
        healthScore: recipe.details?.healthScore || 70,
        summary:
          recipe.details?.summary?.replace(/<[^>]*>/g, "") ||
          `This recipe uses ${recipe.usedIngredientCount} of the ingredients you have.`,
        weightWatcherSmartPoints:
          recipe.details?.weightWatcherSmartPoints || null,
        calories:
          recipe.details?.nutrition?.nutrients?.find(
            (n) => n.name === "Calories"
          )?.amount || null,
        carbs:
          recipe.details?.nutrition?.nutrients?.find(
            (n) => n.name === "Carbohydrates"
          )?.amount + " g" || null,
        fat:
          recipe.details?.nutrition?.nutrients?.find((n) => n.name === "Fat")
            ?.amount + " g" || null,
        protein:
          recipe.details?.nutrition?.nutrients?.find(
            (n) => n.name === "Protein"
          )?.amount + " g" || null,
        // External API indicator
        source: "external",
        usedIngredientCount: recipe.usedIngredientCount,
        missedIngredientCount: recipe.missedIngredientCount,
      }));
    }

    // Mark local recipes
    const markedLocalRecipes = localRecipes.map((recipe) => {
      const recipeObj = recipe.toObject();
      recipeObj.source = "local";
      return recipeObj;
    });

    // Combine results
    const combinedResults = [...markedLocalRecipes, ...externalRecipes];

    if (combinedResults.length === 0) {
      return res
        .status(404)
        .json({ message: "No recipes found with those ingredients" });
    }

    return res.status(200).json(combinedResults);
  } catch (error) {
    console.error("Error searching recipes by ingredients:", error.message);
    return res.status(500).json({
      message: "Error searching recipes by ingredients",
      error: error.message,
    });
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

    // Build query for local database
    let dbQuery = {};

    // Parse numeric values for database query
    if (minCalories) dbQuery.calories = { $gte: parseFloat(minCalories) };
    if (maxCalories) {
      dbQuery.calories = dbQuery.calories || {};
      dbQuery.calories.$lte = parseFloat(maxCalories);
    }

    // Search in local database
    const localRecipes = await Recipe.find(dbQuery).limit(6);

    // Mark local recipes
    const markedLocalRecipes = localRecipes.map((recipe) => {
      const recipeObj = recipe.toObject();
      recipeObj.source = "local";
      return recipeObj;
    });

    // Configuration for API Spoonacular - Find by Nutrients
    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/findByNutrients",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        number: 6, // Reduced to combine with local recipes
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

    let transformedExternalRecipes = [];

    try {
      // Get recipes from external API
      const response = await axios(options);

      if (response.data && response.data.length > 0) {
        // Transform data from external API
        transformedExternalRecipes = response.data.map((recipe) => ({
          _id: recipe.id,
          title: recipe.title,
          servings: recipe.servings || 4,
          readyInMinutes: recipe.readyInMinutes || 30,
          preparationMinutes: Math.floor((recipe.readyInMinutes || 30) * 0.4),
          cookingMinutes: Math.floor((recipe.readyInMinutes || 30) * 0.6),
          ingredients: [], // Not available in nutrient endpoint
          dishTypes: "main course",
          tags: "nutrient-based, healthy",
          area: "international",
          instructions: "Use getDetailRecipe endpoint to get full instructions",
          video: null,
          createdByUser: null,
          dateModified: null,
          image: recipe.image,
          healthScore: null,
          summary: `Recipe found based on nutritional criteria - ${recipe.calories} calories`,
          weightWatcherSmartPoints: null,
          calories: recipe.calories,
          carbs: recipe.carbs,
          fat: recipe.fat,
          protein: recipe.protein,
          // Additional nutritional info if available
          ...(recipe.sugar && { sugar: recipe.sugar }),
          ...(recipe.fiber && { fiber: recipe.fiber }),
          // Search criteria info
          source: "external",
          searchCriteria: { ...req.query },
        }));
      }
    } catch (apiError) {
      console.error("External API error:", apiError.message);
      // Continue with only local results if API fails
    }

    // Combine results
    const combinedResults = [
      ...markedLocalRecipes,
      ...transformedExternalRecipes,
    ];

    if (combinedResults.length === 0) {
      return res.status(404).json({
        message: "No recipes found with the specified nutritional criteria",
      });
    }

    return res.status(200).json(combinedResults);
  } catch (error) {
    console.error("Error searching recipes by nutrients:", error.message);
    return res.status(500).json({
      message: "Error searching recipes by nutrients",
      error: error.message,
    });
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

    // Create update payload based on existing recipe
    const updateData = { ...existingRecipe.toObject() };
    delete updateData._id; // Remove _id to avoid conflicts

    // Only update fields that are provided in the request body
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    });

    // Process tags if provided
    if (req.body.tags && typeof req.body.tags === "string") {
      updateData.tags = req.body.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .join(", ");
    }

    // Process ingredients if provided
    if (req.body.ingredients && typeof req.body.ingredients === "string") {
      updateData.ingredients = req.body.ingredients
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

    // Handle file upload if provided
    if (req.file) {
      console.log("📁 Single file detected:", req.file);

      // Cek tipe file berdasarkan fieldname atau mimetype
      if (
        req.file.fieldname === "foodImage" ||
        req.file.mimetype.startsWith("image/")
      ) {
        const imagePath = `/images/foodImages/${req.file.filename}`;
        updateData.image = imagePath;
        updateData.video = null; // Set video ke null jika upload image
        console.log("✅ Image uploaded:", updateData.image);
      } else if (
        req.file.fieldname === "foodVideo" ||
        req.file.mimetype.startsWith("video/")
      ) {
        const videoPath = `videos/foodVideos/${req.file.filename}`;
        updateData.video = videoPath;
        updateData.image = null; // Set image ke null jika upload video
        console.log("✅ Video uploaded:", updateData.video);
      } else {
        // Default ke image jika tidak bisa deteksi
        const imagePath = `images/foodImages/${req.file.filename}`;
        updateData.image = imagePath;
        updateData.video = null;
        console.log("✅ File uploaded as image (default):", updateData.image);
      }
    } else if (req.body.image === null || req.body.video === null) {
      // Only update image/video if explicitly set to null in request
      if (req.body.image === null) updateData.image = null;
      if (req.body.video === null) updateData.video = null;
    }

    // Set dateModified to current date when updating
    updateData.dateModified = new Date();

    // Skip full validation for partial updates
    const updatedRecipe = await Recipe.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: false, // Don't run mongoose validators to allow partial updates
    });

    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully!",
      data: updatedRecipe,
    });
  } catch (error) {
    // Clean up uploaded files in case of error
    if (req.files) {
      Object.values(req.files)
        .flat()
        .forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        });
    } else if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    console.error("Error updating recipe:", error);

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
      message: "Error updating recipe",
      error: error.message,
    });
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
