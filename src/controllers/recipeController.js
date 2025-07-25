const { Recipe, User } = require("../models");
const { recipeValidation } = require("../utils/validations/RecipeValidation");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { cloudinary } = require("../utils/cloudinary/cloudinary");

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

    // ✅ PERBAIKAN: Process ingredients input dengan lebih baik
    const ingredientList = ingredients
      .split(",")
      .map((ingredient) => ingredient.trim())
      .filter((ingredient) => ingredient.length > 0);

    if (ingredientList.length === 0) {
      return res.status(400).json({
        message: "Please provide valid ingredients separated by commas",
      });
    }

    console.log("🔍 Searching for ingredients:", ingredientList);

    // ✅ PERBAIKAN: Search in local database dengan query yang lebih akurat
    const searchQueries = ingredientList.map((ingredient) => ({
      $or: [
        { "ingredients.name": { $regex: new RegExp(ingredient, "i") } },
        { tags: { $regex: new RegExp(ingredient, "i") } },
        { title: { $regex: new RegExp(ingredient, "i") } },
      ],
    }));

    const localRecipes = await Recipe.find({
      $or: searchQueries,
    });

    // ✅ PERBAIKAN: Format ingredients untuk Spoonacular API
    const formattedIngredients = ingredientList.join(",+");

    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/findByIngredients",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: {
        ingredients: formattedIngredients,
        number: 10,
        ranking: 1,
        ignorePantry: true,
      },
    };

    console.log("🌐 API Request URL:", options.url);
    console.log("📋 API Params:", options.params);

    const response = await axios(options);
    let externalRecipes = [];

    if (response.data && response.data.length > 0) {
      console.log(
        "📦 Found",
        response.data.length,
        "recipes from external API"
      );

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
              `❌ Error fetching details for recipe ${recipe.id}:`,
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
          // ✅ Used ingredients (yang user punya)
          ...(recipe.usedIngredients?.map((ing) => ({
            name: ing.name,
            measure: `${ing.amount} ${ing.unit}`.trim(),
            used: true,
            status: "available",
          })) || []),
          // ✅ Missing ingredients (yang user tidak punya)
          ...(recipe.missedIngredients?.map((ing) => ({
            name: ing.name,
            measure: `${ing.amount} ${ing.unit}`.trim(),
            missing: true,
            status: "needed",
          })) || []),
        ],
        dishTypes: recipe.details?.dishTypes?.join(", ") || "main course",
        tags:
          recipe.details?.diets?.join(", ") ||
          `ingredient-based, ${recipe.usedIngredientCount} available ingredients`,
        area: recipe.details?.cuisines?.join(", ") || "international",
        instructions:
          recipe.details?.instructions?.replace(/<[^>]*>/g, "") ||
          `Recipe using ${recipe.usedIngredientCount} ingredients you have available.`,
        video: null,
        createdByUser: null,
        dateModified: null,
        image: recipe.image,
        healthScore: recipe.details?.healthScore || 70,
        summary:
          recipe.details?.summary?.replace(/<[^>]*>/g, "") ||
          `This recipe uses ${recipe.usedIngredientCount} ingredients you have and requires ${recipe.missedIngredientCount} additional ingredients.`,
        weightWatcherSmartPoints:
          recipe.details?.weightWatcherSmartPoints || null,
        calories:
          recipe.details?.nutrition?.nutrients?.find(
            (n) => n.name === "Calories"
          )?.amount || null,
        carbs: recipe.details?.nutrition?.nutrients?.find(
          (n) => n.name === "Carbohydrates"
        )?.amount
          ? recipe.details.nutrition.nutrients.find(
              (n) => n.name === "Carbohydrates"
            ).amount + " g"
          : null,
        fat: recipe.details?.nutrition?.nutrients?.find((n) => n.name === "Fat")
          ?.amount
          ? recipe.details.nutrition.nutrients.find((n) => n.name === "Fat")
              .amount + " g"
          : null,
        protein: recipe.details?.nutrition?.nutrients?.find(
          (n) => n.name === "Protein"
        )?.amount
          ? recipe.details.nutrition.nutrients.find((n) => n.name === "Protein")
              .amount + " g"
          : null,
        // ✅ HAPUS: source dan searchedIngredients
        usedIngredientCount: recipe.usedIngredientCount,
        missedIngredientCount: recipe.missedIngredientCount,
      }));
    } else {
      console.log("❌ No recipes found from external API");
    }

    // ✅ PERBAIKAN: Mark local recipes tanpa menambahkan source dan searchedIngredients
    const markedLocalRecipes = localRecipes.map((recipe) => {
      const recipeObj = recipe.toObject();
      // ✅ HAPUS: jangan tambahkan source dan searchedIngredients
      return recipeObj;
    });

    // ✅ PERBAIKAN: Sort results by relevance
    const sortedExternalRecipes = externalRecipes.sort((a, b) => {
      if (a.usedIngredientCount !== b.usedIngredientCount) {
        return b.usedIngredientCount - a.usedIngredientCount;
      }
      return a.missedIngredientCount - b.missedIngredientCount;
    });

    // Combine results
    const combinedResults = [...markedLocalRecipes, ...sortedExternalRecipes];

    if (combinedResults.length === 0) {
      return res.status(404).json({
        message: `No recipes found with ingredients: ${ingredientList.join(", ")}`,
        suggestion:
          "Try searching with different ingredients or check the spelling",
      });
    }

    console.log("✅ Found total:", combinedResults.length, "recipes");

    // ✅ PERBAIKAN: Hapus searchInfo juga atau sederhanakan
    return res.status(200).json(combinedResults);
  } catch (error) {
    console.error("❌ Error searching recipes by ingredients:", error.message);
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
        example:
          "?minCalories=200.5&maxCalories=500.75&minProtein=10.25&maxProtein=50.80",
      });
    }

    // ✅ PERBAIKAN: Parse decimal values dengan validasi min/max
    const parseNutrientValue = (value, paramName) => {
      if (!value) return null;

      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw new Error(
          `Invalid ${paramName}: must be a valid number (e.g., 234.23)`
        );
      }
      if (parsed < 0) {
        throw new Error(`Invalid ${paramName}: must be a positive number`);
      }
      return parsed;
    };

    // Parse and validate all nutrient parameters
    let parsedParams = {};
    try {
      parsedParams = {
        minCalories: parseNutrientValue(minCalories, "minCalories"),
        maxCalories: parseNutrientValue(maxCalories, "maxCalories"),
        minProtein: parseNutrientValue(minProtein, "minProtein"),
        maxProtein: parseNutrientValue(maxProtein, "maxProtein"),
        minCarbs: parseNutrientValue(minCarbs, "minCarbs"),
        maxCarbs: parseNutrientValue(maxCarbs, "maxCarbs"),
        minFat: parseNutrientValue(minFat, "minFat"),
        maxFat: parseNutrientValue(maxFat, "maxFat"),
        minSugar: parseNutrientValue(minSugar, "minSugar"),
        maxSugar: parseNutrientValue(maxSugar, "maxSugar"),
        minFiber: parseNutrientValue(minFiber, "minFiber"),
        maxFiber: parseNutrientValue(maxFiber, "maxFiber"),
      };
    } catch (validationError) {
      return res.status(400).json({
        message: "Invalid parameter format",
        error: validationError.message,
        example:
          "Use decimal numbers like: minCalories=234.23&maxCalories=500.75",
      });
    }

    // ✅ PERBAIKAN: Validate min/max relationships
    const validateMinMax = (min, max, nutrientName) => {
      if (min !== null && max !== null && min > max) {
        throw new Error(
          `min${nutrientName} (${min}) cannot be greater than max${nutrientName} (${max})`
        );
      }
    };

    try {
      validateMinMax(
        parsedParams.minCalories,
        parsedParams.maxCalories,
        "Calories"
      );
      validateMinMax(
        parsedParams.minProtein,
        parsedParams.maxProtein,
        "Protein"
      );
      validateMinMax(parsedParams.minCarbs, parsedParams.maxCarbs, "Carbs");
      validateMinMax(parsedParams.minFat, parsedParams.maxFat, "Fat");
      validateMinMax(parsedParams.minSugar, parsedParams.maxSugar, "Sugar");
      validateMinMax(parsedParams.minFiber, parsedParams.maxFiber, "Fiber");
    } catch (validationError) {
      return res.status(400).json({
        message: "Invalid parameter range",
        error: validationError.message,
      });
    }

    console.log("🔍 Searching with nutrient criteria:", parsedParams);

    // ✅ PERBAIKAN: Build query for local database dengan range support
    let dbQuery = {};

    // Handle calories range
    if (
      parsedParams.minCalories !== null ||
      parsedParams.maxCalories !== null
    ) {
      dbQuery.calories = {};
      if (parsedParams.minCalories !== null) {
        dbQuery.calories.$gte = parsedParams.minCalories;
      }
      if (parsedParams.maxCalories !== null) {
        dbQuery.calories.$lte = parsedParams.maxCalories;
      }
    }

    // Search in local database
    const localRecipes = await Recipe.find(dbQuery).limit(10);

    console.log(`📊 Local DB found: ${localRecipes.length} recipes`);

    // ✅ PERBAIKAN: Clean local recipes
    const cleanLocalRecipes = localRecipes.map((recipe) => {
      const recipeObj = recipe.toObject();
      return recipeObj;
    });

    // ✅ PERBAIKAN: Configuration for Spoonacular API - direct parameter mapping
    const apiParams = {
      number: 15, // Reasonable limit
    };

    // ✅ Direct mapping of parameters to Spoonacular API
    if (parsedParams.minCalories !== null)
      apiParams.minCalories = parsedParams.minCalories;
    if (parsedParams.maxCalories !== null)
      apiParams.maxCalories = parsedParams.maxCalories;
    if (parsedParams.minProtein !== null)
      apiParams.minProtein = parsedParams.minProtein;
    if (parsedParams.maxProtein !== null)
      apiParams.maxProtein = parsedParams.maxProtein;
    if (parsedParams.minCarbs !== null)
      apiParams.minCarbs = parsedParams.minCarbs;
    if (parsedParams.maxCarbs !== null)
      apiParams.maxCarbs = parsedParams.maxCarbs;
    if (parsedParams.minFat !== null) apiParams.minFat = parsedParams.minFat;
    if (parsedParams.maxFat !== null) apiParams.maxFat = parsedParams.maxFat;
    if (parsedParams.minSugar !== null)
      apiParams.minSugar = parsedParams.minSugar;
    if (parsedParams.maxSugar !== null)
      apiParams.maxSugar = parsedParams.maxSugar;
    if (parsedParams.minFiber !== null)
      apiParams.minFiber = parsedParams.minFiber;
    if (parsedParams.maxFiber !== null)
      apiParams.maxFiber = parsedParams.maxFiber;

    const options = {
      method: "GET",
      url: "https://api.spoonacular.com/recipes/findByNutrients",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SPOONACULAR_API_KEY,
      },
      params: apiParams,
    };

    console.log("🌐 API Request params:", apiParams);
    console.log(
      "🔗 Full API URL:",
      `${options.url}?${new URLSearchParams(apiParams).toString()}`
    );

    let transformedExternalRecipes = [];

    try {
      // ✅ DEBUG: Log request details
      console.log("📤 Making API request to:", options.url);
      console.log("📋 With params:", JSON.stringify(apiParams, null, 2));

      // Get recipes from external API
      const response = await axios(options);

      console.log("📥 API Response Status:", response.status);
      console.log("📥 API Response Data Length:", response.data?.length || 0);

      if (response.data && response.data.length > 0) {
        console.log(
          "📦 Found",
          response.data.length,
          "recipes from external API"
        );

        transformedExternalRecipes = response.data.map((recipe) => ({
          _id: recipe.id,
          title: recipe.title,
          servings: recipe.servings || 2,
          readyInMinutes: recipe.readyInMinutes || 20,
          preparationMinutes:
            recipe.preparationMinutes ||
            Math.floor((recipe.readyInMinutes || 20) * 0.4),
          cookingMinutes:
            recipe.cookingMinutes ||
            Math.floor((recipe.readyInMinutes || 20) * 0.6),
          ingredients:
            recipe.extendedIngredients?.map((ing) => ({
              name: ing.name,
              measure: `${ing.amount} ${ing.unit}`.trim() || ing.original,
            })) || [],
          dishTypes: recipe.dishTypes?.join(", ") || "main course",
          tags: recipe.diets?.join(", ") || "healthy",
          area: recipe.cuisines?.join(", ") || "international",
          instructions: recipe.instructions
            ? recipe.instructions.replace(/<[^>]*>/g, "")
            : "Instructions not available from external source",
          video: recipe.videoUrl || null,
          createdByUser: null,
          dateModified: null,
          image: recipe.image,
          healthScore: recipe.healthScore || 50,
          summary: recipe.summary
            ? recipe.summary.replace(/<[^>]*>/g, "")
            : `Recipe with ${parseFloat(recipe.calories || 0).toFixed(1)} calories`,
          weightWatcherSmartPoints: recipe.weightWatcherSmartPoints || null,
          calories: parseFloat(recipe.calories) || null,
          carbs: parseFloat(recipe.carbs) || null,
          fat: parseFloat(recipe.fat) || null,
          protein: parseFloat(recipe.protein) || null,
          ...(recipe.sugar && { sugar: parseFloat(recipe.sugar) }),
          ...(recipe.fiber && { fiber: parseFloat(recipe.fiber) }),
        }));

        // ✅ Sort by calories ascending (terendah dulu)
        transformedExternalRecipes.sort(
          (a, b) => (a.calories || 0) - (b.calories || 0)
        );
      } else {
        console.log("❌ No recipes found from external API");
      }
    } catch (apiError) {
      console.error("❌ External API error:", apiError.message);
      console.error("❌ API Error Status:", apiError.response?.status);
      console.error("❌ API Error Data:", apiError.response?.data);

      // Return detailed API error for debugging
      if (apiError.response?.status === 402) {
        return res.status(402).json({
          message: "API quota exceeded or payment required",
          error: "Please check your Spoonacular API subscription",
        });
      }

      // Continue with only local results if API fails
    }

    // ✅ Sort local recipes by calories ascending
    cleanLocalRecipes.sort((a, b) => (a.calories || 0) - (b.calories || 0));

    // Combine results
    const combinedResults = [
      ...cleanLocalRecipes,
      ...transformedExternalRecipes,
    ];

    if (combinedResults.length === 0) {
      return res.status(404).json({
        message: "No recipes found with the specified nutritional criteria",
        searchedCriteria: Object.fromEntries(
          Object.entries(parsedParams).filter(([_, value]) => value !== null)
        ),
        suggestion: "Try adjusting the nutrient ranges or use fewer criteria",
      });
    }
    return res.status(200).json(combinedResults);
  } catch (error) {
    console.error("❌ Error searching recipes by nutrients:", error.message);
    return res.status(500).json({
      message: "Error searching recipes by nutrients",
      error: error.message,
    });
  }
};

// =========================================================================================================================

const insertRecipeWithMulter = async (req, res) => {
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

    if (req.body.title) {
      const existingRecipe = await Recipe.findOne({
        title: { $regex: new RegExp(`^${req.body.title.trim()}$`, "i") },
        createdByUser: userId,
      });

      if (existingRecipe) {
        return res.status(409).json({
          success: false,
          message: "Recipe with this title already exists",
          error: `You already have a recipe titled "${req.body.title}". Please use a different title.`,
          suggestion: "Try adding a variation or description to make it unique",
        });
      }
    }

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

    req.body.image = null;
    req.body.video = null;

    // ✅ DEBUG: Log file structure
    console.log("🔍 DEBUG - req.file:", !!req.file);
    console.log("🔍 DEBUG - req.files:", !!req.files);
    if (req.files) {
      console.log(
        "🔍 DEBUG - req.files structure:",
        JSON.stringify(req.files, null, 2)
      );
    }

    req.body.image = null;
    req.body.video = null;

    // ✅ DEBUG: Log file structure
    console.log("🔍 DEBUG - req.file:", !!req.file);
    console.log("🔍 DEBUG - req.files:", !!req.files);
    if (req.files) {
      console.log(
        "🔍 DEBUG - req.files structure:",
        JSON.stringify(req.files, null, 2)
      );
    }

    // ✅ HANDLE MULTIPLE FILES dengan logic yang diperbaiki
    if (req.files && typeof req.files === "object") {
      console.log("📁 Processing req.files:", Object.keys(req.files));

      const fileFields = Object.keys(req.files);
      console.log("📁 Available fields:", fileFields);

      for (const fieldName of fileFields) {
        const files = req.files[fieldName];

        if (Array.isArray(files) && files.length > 0) {
          const file = files[0];
          console.log(`📁 Processing field '${fieldName}':`, {
            filename: file.filename,
            mimetype: file.mimetype,
            fieldname: file.fieldname,
            originalname: file.originalname,
          });

          // ✅ FIX: PRIORITY - Check field name first, then mimetype as fallback
          if (
            fieldName.toLowerCase() === "image" ||
            fieldName.toLowerCase() === "foodimage"
          ) {
            // ✅ Field name is explicitly for image
            req.body.image = `/images/foodImages/${file.filename}`;
            console.log(
              "✅ Image set by FIELD NAME:",
              fieldName,
              "->",
              req.body.image
            );
          } else if (
            fieldName.toLowerCase() === "video" ||
            fieldName.toLowerCase() === "foodvideo"
          ) {
            // ✅ Field name is explicitly for video
            req.body.video = `/videos/foodVideos/${file.filename}`;
            console.log(
              "✅ Video set by FIELD NAME:",
              fieldName,
              "->",
              req.body.video
            );
          }
          // ✅ FALLBACK: If field name is ambiguous, check mimetype
          else if (file.mimetype.startsWith("image/")) {
            req.body.image = `/images/foodImages/${file.filename}`;
            console.log(
              "✅ Image set by MIMETYPE:",
              file.mimetype,
              "->",
              req.body.image
            );
          } else if (file.mimetype.startsWith("video/")) {
            req.body.video = `/videos/foodVideos/${file.filename}`;
            console.log(
              "✅ Video set by MIMETYPE:",
              file.mimetype,
              "->",
              req.body.video
            );
          } else {
            console.log("❌ Unknown file type:", {
              fieldName,
              mimetype: file.mimetype,
              filename: file.filename,
            });
          }
        } else {
          console.log(
            `❌ No files in field '${fieldName}' or not an array:`,
            files
          );
        }
      }
    }
    // ✅ HANDLE SINGLE FILE
    else if (req.file) {
      console.log("📁 Processing single file:", {
        fieldname: req.file.fieldname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });

      // ✅ Priority: Field name first, then mimetype
      if (
        req.file.fieldname.toLowerCase() === "image" ||
        req.file.fieldname.toLowerCase() === "foodimage"
      ) {
        req.body.image = `/images/foodImages/${req.file.filename}`;
        console.log("✅ Single image set by FIELD NAME:", req.body.image);
      } else if (
        req.file.fieldname.toLowerCase() === "video" ||
        req.file.fieldname.toLowerCase() === "foodvideo"
      ) {
        req.body.video = `/videos/foodVideos/${req.file.filename}`;
        console.log("✅ Single video set by FIELD NAME:", req.body.video);
      } else if (req.file.mimetype.startsWith("image/")) {
        req.body.image = `/images/foodImages/${req.file.filename}`;
        console.log("✅ Single image set by MIMETYPE:", req.body.image);
      } else if (req.file.mimetype.startsWith("video/")) {
        req.body.video = `/videos/foodVideos/${req.file.filename}`;
        console.log("✅ Single video set by MIMETYPE:", req.body.video);
      }
    } else {
      console.log("❌ No files detected");
    }

    // ✅ DEBUG: Final check
    console.log("🔍 FINAL RESULT:");
    console.log("📸 Image:", req.body.image);
    console.log("🎥 Video:", req.body.video);

    const validated = await recipeValidation.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
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
      message: error.message || "Internal server error",
    });
  }
};

// =========================================================================================================================
const insertRecipeWithCloud = async (req, res) => {
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

    if (req.body.title) {
      const existingRecipe = await Recipe.findOne({
        title: { $regex: new RegExp(`^${req.body.title.trim()}$`, "i") },
        createdByUser: userId,
      });

      if (existingRecipe) {
        return res.status(409).json({
          success: false,
          message: "Recipe with this title already exists",
          error: `You already have a recipe titled "${req.body.title}". Please use a different title.`,
          suggestion: "Try adding a variation or description to make it unique",
        });
      }
    }

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

    req.body.image = null;
    req.body.video = null;

    // ✅ DEBUG: Log file structure
    console.log("🔍 CLOUDINARY DEBUG - req.files:", !!req.files);
    if (req.files) {
      console.log(
        "🔍 CLOUDINARY DEBUG - req.files structure:",
        JSON.stringify(req.files, null, 2)
      );
    }

    // ✅ CLOUDINARY FILE HANDLING - Super Simple!
    if (req.files && typeof req.files === "object") {
      console.log(
        "📁 CLOUDINARY - Processing uploaded files:",
        Object.keys(req.files)
      );

      // Handle foodImage
      if (req.files.foodImage && req.files.foodImage.length > 0) {
        req.body.image = req.files.foodImage[0].path; // URL dari Cloudinary
        console.log("✅ CLOUDINARY - Image uploaded successfully:");
        console.log("📸 Image URL:", req.body.image);
        console.log("📸 Image public_id:", req.files.foodImage[0].public_id);
      }

      // Handle foodVideo
      if (req.files.foodVideo && req.files.foodVideo.length > 0) {
        req.body.video = req.files.foodVideo[0].path; // URL dari Cloudinary
        console.log("✅ CLOUDINARY - Video uploaded successfully:");
        console.log("🎥 Video URL:", req.body.video);
        console.log("🎥 Video public_id:", req.files.foodVideo[0].public_id);
      }
    } else {
      console.log("❌ CLOUDINARY - No files detected");
    }

    // ✅ DEBUG: Final check
    console.log("🔍 CLOUDINARY FINAL RESULT:");
    console.log("📸 Final Image URL:", req.body.image);
    console.log("🎥 Final Video URL:", req.body.video);

    const validated = await recipeValidation.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true,
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
const deleteCloudinaryMedia = async (mediaUrl) => {
  if (!mediaUrl || !mediaUrl.includes("cloudinary")) {
    console.log("⚠️  No valid Cloudinary URL to delete:", mediaUrl);
    return;
  }

  try {
    const urlParts = mediaUrl.split("/");

    // ✅ YOUR METHOD: Extract public_id with folder structure
    const publicIdWithFormat = urlParts
      .slice(urlParts.indexOf("proyekWS"))
      .join("/");
    const publicId = publicIdWithFormat.substring(
      0,
      publicIdWithFormat.lastIndexOf(".")
    );

    if (!publicId) {
      console.log("❌ Could not extract public_id from URL:", mediaUrl);
      return;
    }

    // ✅ MY METHOD: Determine resource type for better handling
    const isVideo = mediaUrl.includes("/video/upload/");
    const resourceType = isVideo ? "video" : "image";

    console.log(`🗑️  Deleting ${resourceType} from Cloudinary:`, publicId);

    // ✅ Delete with resource type specification
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    console.log(`✅ Successfully deleted ${resourceType}:`, publicId);
    console.log("🔍 Deletion result:", result);

    return result;
  } catch (error) {
    console.error("❌ Failed to delete media from Cloudinary:", error);
    // Don't throw - let update continue even if deletion fails
  }
};
// =========================================================================================================================
const updateRecipeWithMulter = async (req, res) => {
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
      if (req.body[key] !== undefined && key !== "image" && key !== "video") {
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

    if (req.files && typeof req.files === "object") {
      console.log("📁 UPDATE - Processing req.files:", Object.keys(req.files));

      const fileFields = Object.keys(req.files);
      console.log("📁 UPDATE - Available fields:", fileFields);

      for (const fieldName of fileFields) {
        const files = req.files[fieldName];

        if (Array.isArray(files) && files.length > 0) {
          const file = files[0];
          console.log(`📁 UPDATE - Processing field '${fieldName}':`, {
            filename: file.filename,
            mimetype: file.mimetype,
            fieldname: file.fieldname,
            originalname: file.originalname,
          });

          // ✅ DIRECT ASSIGNMENT - Prioritas field name
          if (
            fieldName.toLowerCase() === "image" ||
            fieldName.toLowerCase() === "foodimage"
          ) {
            const newImagePath = `/images/foodImages/${file.filename}`;
            updateData.image = newImagePath;
            console.log(
              "✅ UPDATE - Image OVERRIDDEN:",
              existingRecipe.image,
              "->",
              newImagePath
            );
          } else if (
            fieldName.toLowerCase() === "video" ||
            fieldName.toLowerCase() === "foodvideo"
          ) {
            const newVideoPath = `/videos/foodVideos/${file.filename}`;
            updateData.video = newVideoPath;
            console.log(
              "✅ UPDATE - Video OVERRIDDEN:",
              existingRecipe.video,
              "->",
              newVideoPath
            );
          }
          // ✅ FALLBACK: Check mimetype
          else if (file.mimetype.startsWith("image/")) {
            const newImagePath = `/images/foodImages/${file.filename}`;
            updateData.image = newImagePath;
            console.log(
              "✅ UPDATE - Image set by MIMETYPE:",
              existingRecipe.image,
              "->",
              newImagePath
            );
          } else if (file.mimetype.startsWith("video/")) {
            const newVideoPath = `/videos/foodVideos/${file.filename}`;
            updateData.video = newVideoPath;
            console.log(
              "✅ UPDATE - Video set by MIMETYPE:",
              existingRecipe.video,
              "->",
              newVideoPath
            );
          } else {
            console.log("❌ UPDATE - Unknown file type:", {
              fieldName,
              mimetype: file.mimetype,
              filename: file.filename,
            });
          }
        } else {
          console.log(
            `❌ UPDATE - No files in field '${fieldName}' or not an array:`,
            files
          );
        }
      }
    }
    // ✅ Handle single file
    else if (req.file) {
      console.log("📁 UPDATE - Processing single file:", {
        fieldname: req.file.fieldname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      });

      // ✅ DIRECT ASSIGNMENT - Priority field name
      if (
        req.file.fieldname.toLowerCase() === "image" ||
        req.file.fieldname.toLowerCase() === "foodimage"
      ) {
        const newImagePath = `/images/foodImages/${req.file.filename}`;
        updateData.image = newImagePath;
        console.log(
          "✅ UPDATE - Single image OVERRIDDEN:",
          existingRecipe.image,
          "->",
          newImagePath
        );
      } else if (
        req.file.fieldname.toLowerCase() === "video" ||
        req.file.fieldname.toLowerCase() === "foodvideo"
      ) {
        const newVideoPath = `/videos/foodVideos/${req.file.filename}`;
        updateData.video = newVideoPath;
        console.log(
          "✅ UPDATE - Single video OVERRIDDEN:",
          existingRecipe.video,
          "->",
          newVideoPath
        );
      } else if (req.file.mimetype.startsWith("image/")) {
        const newImagePath = `/images/foodImages/${req.file.filename}`;
        updateData.image = newImagePath;
        console.log(
          "✅ UPDATE - Single image set by MIMETYPE:",
          existingRecipe.image,
          "->",
          newImagePath
        );
      } else if (req.file.mimetype.startsWith("video/")) {
        const newVideoPath = `/videos/foodVideos/${req.file.filename}`;
        updateData.video = newVideoPath;
        console.log(
          "✅ UPDATE - Single video set by MIMETYPE:",
          existingRecipe.video,
          "->",
          newVideoPath
        );
      }
    } else {
      console.log("❌ UPDATE - No files detected, keeping original paths");
    }

    // ✅ DEBUG: Final check - sama seperti insertRecipe
    console.log("🔍 UPDATE FINAL RESULT:");
    console.log("📸 Update Image:", updateData.image);
    console.log("🎥 Update Video:", updateData.video);

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
const updateRecipeWithCloud = async (req, res) => {
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

    const updateData = { ...existingRecipe.toObject() };
    delete updateData._id; // Remove _id to avoid conflicts

    // Only update fields that are provided in the request body
    Object.keys(req.body).forEach((key) => {
      if (req.body[key] !== undefined && key !== "image" && key !== "video") {
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

    if (req.files && typeof req.files === "object") {
      console.log(
        "📁 CLOUDINARY UPDATE - Processing uploaded files:",
        Object.keys(req.files)
      );

      // Handle foodImage update
      if (req.files.foodImage && req.files.foodImage.length > 0) {
        console.log("📸 CLOUDINARY UPDATE - Processing new image");

        // ✅ Log old image details
        console.log("🗑️  Current image to be replaced:", existingRecipe.image);

        // ✅ Delete old image from Cloudinary if exists
        if (
          existingRecipe.image &&
          existingRecipe.image.includes("cloudinary")
        ) {
          console.log("🗑️  Deleting old image from Cloudinary...");
          await deleteCloudinaryMedia(existingRecipe.image);
        }

        // ✅ Set new image URL from Cloudinary
        updateData.image = req.files.foodImage[0].path;

        // ✅ Detailed logging for new image
        console.log("✅ CLOUDINARY UPDATE - Image updated successfully:");
        console.log("📸 Old Image URL:", existingRecipe.image);
        console.log("📸 New Image URL:", updateData.image);
        console.log(
          "📸 New Image public_id:",
          req.files.foodImage[0].public_id
        );
        console.log(
          "📸 New Image filename:",
          req.files.foodImage[0].filename || "auto-generated"
        );
        console.log(
          "📸 Original filename:",
          req.files.foodImage[0].originalname
        );
      }

      // Handle foodVideo update
      if (req.files.foodVideo && req.files.foodVideo.length > 0) {
        console.log("🎥 CLOUDINARY UPDATE - Processing new video");

        // ✅ Log old video details
        console.log("🗑️  Current video to be replaced:", existingRecipe.video);

        // ✅ Delete old video from Cloudinary if exists
        if (
          existingRecipe.video &&
          existingRecipe.video.includes("cloudinary")
        ) {
          console.log("🗑️  Deleting old video from Cloudinary...");
          await deleteCloudinaryMedia(existingRecipe.video);
        }

        // ✅ Set new video URL from Cloudinary
        updateData.video = req.files.foodVideo[0].path;

        // ✅ Detailed logging for new video
        console.log("✅ CLOUDINARY UPDATE - Video updated successfully:");
        console.log("🎥 Old Video URL:", existingRecipe.video);
        console.log("🎥 New Video URL:", updateData.video);
        console.log(
          "🎥 New Video public_id:",
          req.files.foodVideo[0].public_id
        );
        console.log(
          "🎥 New Video filename:",
          req.files.foodVideo[0].filename || "auto-generated"
        );
        console.log(
          "🎥 Original filename:",
          req.files.foodVideo[0].originalname
        );
      }

      // ✅ Summary logging
      const processedFields = [];
      if (req.files.foodImage) processedFields.push("foodImage");
      if (req.files.foodVideo) processedFields.push("foodVideo");

      if (processedFields.length > 0) {
        console.log(
          "✅ CLOUDINARY UPDATE - Successfully processed fields:",
          processedFields
        );
        console.log("🔄 Total files replaced:", processedFields.length);
      }
    }

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
  updateRecipeWithMulter,
  updateRecipeWithCloud,
  insertRecipeWithCloud,
  insertRecipeWithMulter,
  deleteRecipe,
  getRecipeByIngredients,
  getRecipeByNutrients,
};
