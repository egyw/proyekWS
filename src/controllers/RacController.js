const axios = require("axios");
const { Review, aiQueries, Recipe, User } = require("../models");
const { $where } = require("../models/User");
const { ObjectId } = require("mongoose").Types;
const {
  cuisines,
  diet,
  intolarances,
  meal_types,
  recipeSortingGrouped,
} = require("../utils/spoonacular/listFoodTypeSpoonacular");
const {
  commentarValidation,
  inputUserValidation,
} = require("../utils/validations");

const addComentar = async (req, res) => {
  try {
    const validated = await commentarValidation.validateAsync(req.body, {
      abortEarly: false,
    });

    const dtUser = req.user;
    const { id } = req.params;
    // const dtRecipes = await Recipe.findOne({
    //   title: new RegExp(`^${validated.title}$`, "i"),
    // });
    if (!id) {
      return res.status(400).json({
        message: "ID resep tidak boleh kosong!",
      });
    }
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "ID resep tidak valid!",
      });
    }
    const dtRecipes = await Recipe.findOne({
      _id: id,
    });
    if (!dtRecipes) {
      return res.status(404).json({
        message: "Resep tidak ditemukan",
      });
    }
    // console.log("Data User:", dtUser);
    // console.log("Data Resep:", dtRecipes);
    let timer = 0;
    setTimeout(async () => {
      // timer += 1;
      // console.log(`Timer: ${timer} detik`);
      const komentarFilter = await validateCommentAI(validated.commentar);
      if (komentarFilter && komentarFilter.toLowerCase() !== "tidak") {
        return res.status(400).json({
          message: "Komentar mengandung unsur SARA, tidak aman untuk publik!",
          error: komentarFilter,
        });
      }
      const newReview = await new Review({
        username: dtUser.username,
        recipeId: dtRecipes.id,
        comment: validated.commentar,
        rating: validated.rating,
      }).save();

      return res.status(200).json({
        message: "Berhasil menampilkan resep",
        data: {
          title: validated.title,
          image_url: "http://localhost:3000/images/tempe.jpg",
          comments: validated.commentar,
          rating: validated.rating,
        },
      });
    }, 30_000);
  } catch (error) {
    if (error.isJoi) {
      const errorMessages = {};
      error.details.forEach((detail) => {
        errorMessages[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        message: "Validasi gagal!",
        error: errorMessages,
      });
    }
    console.error("Error adding comment:", error);
    return res.status(500).json({
      message: "Gagal menambahkan komentar",
      error: error.message,
    });
  }
};

const getListReview = async (req, res) => {
  const { title } = req.params;
  if (!title) {
    return res.status(400).json({
      message: "Title tidak boleh kosong!",
    });
  }

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
    cuisines: cuisines,
    // diet: diet,
    // intolarances: intolarances,
    // meal_types: meal_types,
    // recipeTypes: recipeSortingGrouped,
  };

  try {
    const validated = await inputUserValidation.validateAsync(req.body, {
      abortEarly: false,
    });
    const dtUser = req.user;
    const userInput = validated.userInput;
    const aiPrompt = `Bedasarkan input pengguna: ${userInput}. dan harus bedasarkan dari data ini : ${JSON.stringify(type)}
    berikan text juga, sebagai hasil dalam bahasa inggris`;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    const textResponse = geminiResult.candidates[0].content.parts[0].text;
    const found = cuisines
      .map((item) => {
        // console.log("Checking item:", item);
        if (textResponse.toLowerCase().includes(item.toLowerCase())) {
          return item;
        }
      })
      .toString();
    const query = found.replace(/,/g, "");
    const response = textResponse
      .replace(/\*\*/g, "")
      .replace(/\* +/g, "- ")
      .replace(/\n{2,}/g, "\n");
    // console.log("Found cuisine:", query);
    console.log(response);
    const spoonacularResponse = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?cuisine=${query}&number=5&apiKey=${process.env.SPOONACULAR_API_KEY}`
    );
    console.log(spoonacularResponse.data);
    const userId = await User.findOne({
      username: dtUser.username,
    });
    // console.log(userId._id, " ", userInput, " ", keywords);
    await aiQueries.create({
      userId: userId._id,
      prompt: userInput,
      response: response,
    });
    return res.status(200).json({
      message: "Berhasil mendapatkan saran makanan",
      data: spoonacularResponse.data.results.map((recipe) => ({
        title: recipe.title,
        image: recipe.image,
        id: recipe.id,
      })),
    });
  } catch (error) {
    console.error("Error in food suggestion:", error);
    return res.status(500).json({
      message: "Gagal mendapatkan saran makanan",
      error: error.message,
    });
  }
};
const aiHistory = async (req, res) => {
  const dtUser = req.user;
  try {
    const userId = await User.findOne({
      username: dtUser.username,
    });
    const dtAiHistory = await aiQueries.find({
      userId: userId._id,
    });
    if (!dtAiHistory || dtAiHistory.length === 0) {
      return res.status(404).json({
        message: "Riwayat AI tidak ditemukan",
      });
    }
    return res.status(200).json({
      message: "Berhasil mendapatkan riwayat AI",
      user: dtUser.username,
      data: dtAiHistory.map((history) => ({
        prompt: history.prompt,
        response: history.response,
      })),
    });
  } catch (error) {
    console.error("Error in AI history:", error);
    return res.status(500).json({
      message: "Gagal mendapatkan riwayat AI",
      error: error.message,
    });
  }
};
const countCalory = async (req, res) => {
  const { title } = req.params;
  if (!title) {
    return res.status(400).json({
      message: "Title tidak boleh kosong!",
    });
  }
  try {
    const dtFood = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?query=${title}&number=1&apiKey=${process.env.SPOONACULAR_API_KEY}`
    );
    const idFood = dtFood.data.results[0].id;
    const infFood = await axios.get(
      `https://api.spoonacular.com/recipes/${idFood}/information?includeNutrition=true&apiKey=${process.env.SPOONACULAR_API_KEY}`
    );
    const nutrients = infFood.data.nutrition.nutrients.map((nutrient) => ({
      name: nutrient.name,
      amount: nutrient.amount,
      unit: nutrient.unit,
      percentOfDailyNeeds: nutrient.percentOfDailyNeeds,
    }));

    const aiPrompt = `Tolong hitung kalori yang dihasilkan
    hitung juga karbo, nutrisi, sugar, cholestrol, alcohol, protein, vitamin yang didapakan
    dari data ini ${JSON.stringify(nutrients)}, tambahkan kesimpulannya juga`;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
    let textResponse = geminiResult.candidates[0].content.parts[0].text;
    textResponse = textResponse
      .replace(/\*\*/g, "") // hapus bold markdown
      .replace(/\* +/g, "- ") // ganti bullet * jadi -
      .replace(/\n{2,}/g, "\n") // hapus newline berlebih
      .replace(/^Baik,.*?nutrisi.*?:\n/i, "") // hapus kalimat pembuka Gemini (opsional)
      .trim();

    return res.status(200).send(textResponse);
  } catch (error) {
    console.error("Error counting calories:", error);
    return res.status(500).json({
      message: "Gagal menghitung kalori",
      error: error.message,
    });
  }
};

const validateCommentAI = async (comment) => {
  try {
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Cek apakah komentar ini mengandung unsur SARA: "${comment}". Jika ada unsur SARA, berikan penjelasan singkat mengapa komentar ini tidak aman untuk publik. Jika tidak ada, cukup jawab "tidak".`,
                },
              ],
            },
          ],
        }),
      }
    );

    const result = await aiResponse.json();
    const textResponse = result.candidates[0].content.parts[0].text.trim();
    return textResponse || "ya";
  } catch (error) {
    console.error("Gagal validasi komentar dengan AI:", error.message);
  }
};
module.exports = {
  addComentar,
  getListReview,
  foodSugestion,
  aiHistory,
  countCalory,
};
