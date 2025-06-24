const { cloudinary } = require('../utils/cloudinary'); // Sesuaikan path jika perlu


const insertRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    req.body.createdByUser = userId;

    // --- LOGIKA UPLOAD BARU ---
    // Cek apakah ada file yang di-upload dan tetapkan path-nya
    if (req.files) {
        if (req.files.foodImage) {
            req.body.image = req.files.foodImage[0].path; // URL dari Cloudinary
        }
        if (req.files.foodVideo) {
            req.body.video = req.files.foodVideo[0].path; // URL dari Cloudinary
        }
    }
    // --- AKHIR LOGIKA UPLOAD BARU ---

    // (Kode untuk memproses tags dan ingredients bisa tetap ada)
    if (req.body.tags && typeof req.body.tags === "string") { /* ... */ }
    if (req.body.ingredients && typeof req.body.ingredients === "string") { /* ... */ }

    // Validasi dan simpan resep
    const validated = await recipeValidation.validateAsync(req.body, { abortEarly: false });
    const newRecipe = new Recipe(validated);
    const savedRecipe = await newRecipe.save();

    return res.status(201).json({
      success: true,
      message: "Recipe created successfully!",
      data: savedRecipe,
    });

  } catch (error) {
    console.error("Error in insertRecipe:", error);
    // (Error handling bisa tetap sama)
    if (error.isJoi) { /* ... */ }
    return res.status(500).json({ /* ... */ });
  }
};


<!-- =================================================================================================== -->

const deleteCloudinaryMedia = async (mediaUrl) => {
    if (!mediaUrl || !mediaUrl.includes('cloudinary')) return;
    try {
        const urlParts = mediaUrl.split('/');
        const publicIdWithFormat = urlParts.slice(urlParts.indexOf('proyekWS')).join('/');
        const publicId = publicIdWithFormat.substring(0, publicIdWithFormat.lastIndexOf('.'));
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log(`Successfully deleted old media: ${publicId}`);
        }
    } catch (e) {
        console.error("Failed to delete old media from Cloudinary", e);
    }
}

<!-- ==================================================================================================== -->
const updateRecipe = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const existingRecipe = await Recipe.findById(id);
    if (!existingRecipe) {
      return res.status(404).json({ success: false, message: "Recipe not found" });
    }
    if (existingRecipe.createdByUser.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to update this recipe" });
    }

    const updateData = { ...req.body };

    // --- LOGIKA UPLOAD BARU UNTUK UPDATE ---
    if (req.files) {
        // Jika ada gambar baru, hapus yang lama dan update path
        if (req.files.foodImage) {
            await deleteCloudinaryMedia(existingRecipe.image); // Hapus yang lama
            updateData.image = req.files.foodImage[0].path; // Set yang baru
        }
        // Jika ada video baru, hapus yang lama dan update path
        if (req.files.foodVideo) {
            await deleteCloudinaryMedia(existingRecipe.video); // Hapus yang lama
            updateData.video = req.files.foodVideo[0].path; // Set yang baru
        }
    }
    // --- AKHIR LOGIKA UPLOAD BARU UNTUK UPDATE ---

    // (Kode untuk memproses tags dan ingredients bisa tetap ada)
    if (req.body.tags && typeof req.body.tags === 'string') { /* ... */ }
    if (req.body.ingredients && typeof req.body.ingredients === 'string') { /* ... */ }
    
    updateData.dateModified = new Date();

    const updatedRecipe = await Recipe.findByIdAndUpdate(id, updateData, { new: true });

    return res.status(200).json({
      success: true,
      message: "Recipe updated successfully!",
      data: updatedRecipe,
    });
  } catch (error) {
    console.error("Error updating recipe:", error);
    // (Error handling bisa tetap sama)
    return res.status(500).json({ success: false, message: "Error updating recipe", error: error.message });
  }
};

<!-- ================================================================================================================ -->
// src/routes/recipe.js
const express = require('express');
const router = express.Router();
const { insertRecipe, updateRecipe, ... } = require('../controllers/recipeController');
const verifyToken = require('../middlewares/authMiddleware');

// HAPUS IMPORT LAMA
// const { uploadImageAndVideo } = require("../utils/multer/multer");

// TAMBAHKAN IMPORT BARU
const { uploadRecipeMedia } = require('../utils/cloudinary'); // Sesuaikan path

// ... (route lain seperti GET, DELETE, dll)

// GANTI ROUTE INSERT INI
// router.post('/', [verifyToken, uploadImageAndVideo()], insertRecipe);
// MENJADI INI:
router.post('/', [verifyToken, uploadRecipeMedia()], insertRecipe);


// GANTI ROUTE UPDATE INI
// router.patch('/:id', [verifyToken, uploadImageAndVideo()], updateRecipe);
// MENJADI INI:
router.patch('/:id', [verifyToken, uploadRecipeMedia()], updateRecipe);

module.exports = router;