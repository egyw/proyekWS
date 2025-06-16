const axios = require("axios");
const { Review, aiQueries, Recipe } = require("../models");
const { $where } = require("../models/User");
const {
  cuisines,
  diet,
  intolarances,
  meal_types,
  recipeSortingGrouped,
} = require("../utils/spoonacular/listFoodTypeSpoonacular");

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
  const type = {
    // cuisines: cuisines,
    // diet: diet,
    // intolarances: intolarances,
    meal_types: meal_types,
    // recipeTypes: recipeSortingGrouped,
  };
  try {
    const dtUser = req.user;
    const { userInput } = req.body;
    const aiPrompt = `Bedasarkan input pengguna: ${userInput}. dan untuk hasil type nya nanti harus bedasarkan ini : ${JSON.stringify(
      type
    )}. berikan jawaban berupa array yang dan isi nya jangan ada text. sebagai Contoh: ["ayam", "sayur", "nasi"]. sebagai hasil dalam bahasa inggris`;
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
    return res.status(400).json({
      message: geminiResult,
    });
    let responseText = geminiResult.candidates[0].content.parts[0].text;
    responseText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const keywords = JSON.parse(responseText);
    console.log("Keywords:", keywords);
    const query = keywords.join(" ");

    // const spoonacularResponse = await fetch(
    //   `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=5&apiKey=${process.env.SPOONACULAR_API_KEY}`
    // );
    // console.log(spoonacularResponse.result);

    // const recipes = await spoonacularResponse.json();
    // if (recipes.results.length === 0) {
    //   return res.status(404).json({
    //     message: "Tidak ada resep yang ditemukan",
    //   });
    // }
    // const recipeDetails = recipes.results.map((recipe) => ({
    //   title: recipe.title,
    //   image: recipe.image,
    //   id: recipe.id,
    // }));
    // await aiQueries.create({
    //   userId: dtUser.username,
    //   prompt: userInput,
    //   response: keywords,
    // });
    return res.status(200).json({
      result: geminiResult,
      message: "Berhasil mendapatkan saran makanan",
      data: recipeDetails,
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
