const axios = require("axios");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const ExcelJS = require("exceljs");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
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
const { sendCommentNotifier } = require("../utils/mailer/mailer");

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
          // alasan: komentarFilter,
        });
      }
      const newReview = await new Review({
        username: dtUser.username,
        recipeId: dtRecipes.id,
        recipeTitle: dtRecipes.title,
        commentedBy: dtUser.id,
        commentedByUsername: dtUser.username,
        comment: validated.commentar,
        rating: validated.rating,
      }).save();

      const commenter = await User.findById(dtRecipes.createdByUser).select(
        "email username -_id"
      );
      await sendCommentNotifier(
        commenter.email,
        commenter.username,
        req.user.username,
        dtRecipes.title,
        validated.commentar,
        validated.rating
      );
      const protocol = req.protocol; // http atau https
      const host = req.get("host"); // localhost:3000 atau namadomain.com

      const imageUrl = `${protocol}://${host}/Public/images/foodImages/${dtRecipes.image}`;
      return res.status(200).json({
        message: "Berhasil menampilkan resep",
        data: {
          title: validated.title,
          image_url: imageUrl,
          comments: validated.commentar,
          rating: validated.rating,
        },
      });
    }, 1_000);
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
  const { id } = req.params;
  console.log(id);

  if (!id) {
    return res.status(400).json({
      message: "Id tidak boleh kosong!",
    });
  }
  try {
    // const dtRecipes = await Recipe.findOne({
    //   title: new RegExp(`^${title}$`, "i"),
    // });
    // if (!dtRecipes) {
    //   return res.status(404).json({
    //     message: "Resep tidak ditemukan",
    //   });
    // }
    const count = await Review.aggregate([
      {
        $match: { recipeId: new mongoose.Types.ObjectId(id) },
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
        $match: { recipeId: new mongoose.Types.ObjectId(id) },
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
    if (!found || found.length === 0) {
      return res.status(404).json({
        message:
          "Mohon Maaf, ini diluar dari kemampuan AI kami, silahkan coba lagi dengan kata kunci lain",
      });
    }
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
    console.log(dtFood.data);

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

const exportToPDF = async (req, res) => {
  try {
    const dtUser = req.user;
    const history = await aiQueries.find({
      userId: dtUser.id,
    });
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="riwayat_ai.pdf"'
    );

    doc.pipe(res);
    doc.fontSize(18).text("Riwayat Tanya AI", { align: "center" });

    doc.moveDown();
    history.forEach((item, i) => {
      doc.fontSize(12).text(`Q${i + 1}: ${item.prompt}`, { bold: true });
      doc.text(`A${i + 1}: ${item.response}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    return res.status(500).json({
      message: "Gagal mengekspor ke PDF",
      error: error.message,
    });
  }
};

const exportInfoToExcel = async (req, res) => {
  const dtUser = req.user;
  const { query, number } = req.body;
  const { type } = req.body || "excel";
  if (type !== "excel" && type !== "chart") {
    return res.status(400).json({
      message: "Type harus 'excel' atau 'chart'",
    });
  }
  if (!query) {
    return res.status(400).json({
      message: "Query tidak boleh kosong!",
    });
  }
  if (!number) {
    return res.status(400).json({
      message: "Number tidak boleh kosong!",
    });
  }
  try {
    const dtFood = await axios.get(
      `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=${number}&addRecipeInformation=true&apiKey=${process.env.SPOONACULAR_API_KEY}`
    );
    if (dtFood.data.results === 0) {
      return res.status(404).json({
        message: "Tidak ada resep yang ditemukan",
      });
    }
    console.log(dtFood.data.results);
    if (type === "chart") {
      return exportWithChart(dtFood.data.results, res);
    }
    if (type === "excel") {
      return exportWithExcel(dtFood.data.results, res);
    }
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return res.status(500).json({
      message: "Gagal mengekspor ke Excel",
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

const exportWithExcel = async (recipes, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Resep");

  // 5. Tambahkan tabel resep
  worksheet.columns = [
    { header: "Judul", key: "title", width: 40 },
    { header: "Spoonacular Score", key: "score", width: 10 },
    { header: "HealthScore", key: "health", width: 10 },
    { header: "Likes", key: "likes", width: 10 },
    { header: "Kategori Gizi", key: "gizi" },
    { header: "Health %", key: "percent" },
  ];

  recipes.forEach((r) => {
    const health = r.healthScore || 0;
    const rating = (r.spoonacularScore / 20).toFixed(1);
    let gizi = "test";
    if (health >= 70) gizi = "Sangat Sehat";
    else if (health >= 50) gizi = "Sehat";
    else if (health >= 30) gizi = "Cukup Sehat";
    else if (health >= 10) gizi = "Kurang Sehat";
    worksheet.addRow({
      title: r.title,
      score: r.spoonacularScore,
      health: r.healthScore,
      likes: r.aggregateLikes,
      gizi: gizi,
      percent: `${health}%`,
    });
  });

  const info = workbook.addWorksheet("Informasi");
  info.addRow([
    "Dokumen ini berisi informasi gizi dan skor makanan dari Spoonacular",
  ]);
  info.addRow(["Kolom 'HealthScore' adalah skor kesehatan makanan (0-100)"]);
  info.addRow([
    "Kolom 'Rating' adalah hasil konversi dari spoonacularScore ke skala 5",
  ]);
  info.addRow([
    "Kolom 'Kategori Gizi' memberikan penilaian tekstual berdasarkan skor",
  ]);
  info.addRow([
    "Data ini cocok digunakan untuk analisis makanan dan perbandingan sehat tidaknya.",
  ]);

  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="top_recipes.xlsx"'
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
};

const exportWithChart = async (recipes, res) => {
  const labels = recipes.map(
    (r) => `${r.title} ${((r.healthScore || 0) / 10).toFixed(1)}`
  );
  const values = recipes.map((r) => r.healthScore || 0);

  // 3. Buat chart gambar (pie)
  const chartCanvas = new ChartJSNodeCanvas({ width: 600, height: 400 });
  const chartImage = await chartCanvas.renderToBuffer({
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#9CCC65",
            "#FF7043",
          ],
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "HealthScore",
        },
        legend: {
          position: "bottom",
        },
      },
    },
  });

  // 4. Buat workbook Excel
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Resep");

  // 5. Tambahkan tabel resep
  worksheet.columns = [
    { header: "Judul", key: "title", width: 40 },
    { header: "Spoonacular Score", key: "score" },
    { header: "HealthScore", key: "health" },
    { header: "Likes", key: "likes" },
  ];

  recipes.forEach((r) => {
    worksheet.addRow({
      title: r.title,
      score: r.spoonacularScore,
      health: r.healthScore,
      likes: r.aggregateLikes,
    });
  });

  // 6. Tambahkan chart ke Excel sebagai gambar
  const imageId = workbook.addImage({
    buffer: chartImage,
    extension: "png",
  });

  worksheet.addImage(imageId, {
    tl: { col: 6, row: 1 },
    ext: { width: 500, height: 300 },
  });

  // 7. Kirim sebagai file download
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="health_score.xlsx"'
  );
  res.send(buffer);
};
module.exports = {
  addComentar,
  getListReview,
  foodSugestion,
  aiHistory,
  countCalory,
  exportToPDF,
  exportInfoToExcel,
};
