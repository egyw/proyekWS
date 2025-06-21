const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destPath = "public/uploads/others"; 

    if (file.fieldname === "profilePicture") {
      if (req.user && req.user.username) {
        destPath = path.join('public', 'images', 'profiles', req.user.id);
      } else {
        destPath = "public/images/profiles/unknown";
      }
    } else if (file.fieldname === "foodImage") { 
      destPath = "public/images/foodImages";
    } else if (file.fieldname === "foodVideo") {
      destPath = "public/videos/foodVideos"; 
    }

    fs.mkdir(destPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, destPath);
    });
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    let customFileName = "";

    if (file.fieldname === "profilePicture") {
      const username = req.user ? req.user.username : 'user';
      customFileName = `${username.replace(/\s+/g, '-').toLowerCase()}-${uniqueSuffix}`;
    } else if (file.fieldname === "foodImage") {
      const foodName = req.body.title || 'food'; 
      customFileName = `${foodName.replace(/\s+/g, '-').toLowerCase()}-${uniqueSuffix}`;
    } else {
      customFileName = `${file.fieldname}-${uniqueSuffix}`;
    }

    const finalFileName = customFileName + path.extname(file.originalname);
    cb(null, finalFileName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "foodVideo") {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true); 
    } else {
      cb(new Error("Hanya file video yang diizinkan untuk field ini!"), false);
    }
  } else {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); 
    } else {
      cb(new Error("Hanya file gambar yang diizinkan untuk field ini!"), false);
    }
  }
};

const imageUploader = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

const videoUploader = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// image
const uploadSingleImage = (fieldName) => imageUploader.single(fieldName);
const uploadMultipleImages = (fieldName, maxCount) => imageUploader.array(fieldName, maxCount);
const uploadFields = (fieldsConfig) => imageUploader.fields(fieldsConfig);

// video
const uploadSingleVideo = (fieldName) => videoUploader.single(fieldName);

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadFields,
  uploadSingleVideo,
};