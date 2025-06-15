const axios = require("axios");
const { Review, aiQueries, Recipe } = require("../models");
const { $where } = require("../models/User");

// kurang validation joi
const addComentar = async (req, res) => {
  const { title, commentar, rating } = req.params;
  try {
    const dtUser = req.user;
    const dtRecipes = await Recipe.findOne({
      title: new RegExp(`^${title}$`, "i"),
    });
    if (!dtRecipes) {
      return res.status(404).json({
        message: "Resep tidak ditemukan",
      });
    }
    console.log("Data User:", dtUser);
    console.log("Data Resep:", dtRecipes);

    const newReview = await new Review({
      username: dtUser.username,
      recipeId: dtRecipes.id,
      comment: commentar,
      rating: rating,
    }).save();

    return res.status(200).json({
      message: "Berhasil menampilkan resep",
      data: {
        title: title,
        image_url: "http://localhost:3000/images/tempe.jpg",
        comments: commentar,
        rating: rating,
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({
      message: "Gagal menambahkan komentar",
      error: error.message,
    });
  }
};

// kurang validation joi
const getListReview = async (req, res) => {
  const { title } = req.params;

  try {
    const dtRecipes = await Recipe.findOne({
      title: new RegExp(`^${title}$`, "i"),
    });
    if (!dtRecipes) {
      return res.status(404).json({
        message: "Resep tidak ditemukan",
      });
    }
    const count = await Review.aggregate([
      {
        $match: { recipeId: dtRecipes.id },
      },
      {
        $group: {
          _id: null,
          ReviewsCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          ReviewsCount: 1,
        },
      },
    ]);
    const reviews = await Review.aggregate([
      {
        $match: { recipeId: dtRecipes.id },
      },
      {
        $project: {
          _id: 0,
          username: 1,
          comment: 1,
          rating: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    console.log(count);

    return res.status(200).json({
      message: "Berhasil mendapatkan daftar komentar",
      ReviewsCount: count.length > 0 ? count[0].ReviewsCount : 0,
      ListReviews: reviews,
    });
  } catch (error) {
    console.error("Error getting reviews:", error);
    return res.status(500).json({
      message: "Gagal mendapatkan daftar komentar",
      error: error.message,
    });
  }
};
const foodSugestion = async (req, res) => {
  try {
    const dtUser = req.user;
    const { userInput } = req.body;
    const aiPrompt = `Berikut input pengguna: ${userInput}`;
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=AIzaSyC-SFRjSVWr13J8zmXMAre5K89BzeP1yFs",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: aiPrompt }],
            },
          ],
        }),
      }
    );
    const geminiResult = await geminiResponse.json();
    // const keywords = JSON.parse(geminiResult.candidates[0].content.parts[0].text);
    return res.status(200).json({
      result: geminiResult,
    });
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
    return res.status(200).json({
      username: dtUser.username,
      premium: dtUser.isPremium,
      message: "You are a premium user, you can use AI Food Suggestion",
    });
  } catch (error) {
    console.error("Error in food suggestion:", error);
    return res.status(500).json({
      message: "Gagal mendapatkan saran makanan",
      error: error.message,
    });
  }
};
const aiHistory = async (req, res) => {};
const countCalory = async (req, res) => {};
module.exports = {
  addComentar,
  getListReview,
  foodSugestion,
  aiHistory,
  countCalory,
};
