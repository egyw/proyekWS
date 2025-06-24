const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destPath = "public/uploads/others";

    if (file.fieldname === "profilePicture") {
      if (req.user && req.user.username) {
        destPath = path.join("public", "images", "profiles", req.user.id);
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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let customFileName = "";

    if (file.fieldname === "profilePicture") {
      const username = req.user ? req.user.username : "user";
      customFileName = `${username.replace(/\s+/g, "-").toLowerCase()}-${uniqueSuffix}`;
    } else if (file.fieldname === "foodImage") {
      const foodName =
        req.body.foodName || req.body.name || req.body.title || "food";
      customFileName = `${foodName.replace(/\s+/g, "-").toLowerCase()}-${uniqueSuffix}`;
    } else if (file.fieldname === "foodVideo") {
      const foodName =
        req.body.foodName || req.body.name || req.body.title || "food";
      customFileName = `${foodName.replace(/\s+/g, "-").toLowerCase()}-${uniqueSuffix}`;
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

const combinedFileFilter = (req, file, cb) => {
  console.log(`🔍 Processing file: ${file.fieldname} - ${file.mimetype}`);

  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar atau video yang diizinkan!"), false);
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

const combinedUploader = multer({
  storage: storage,
  fileFilter: combinedFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB untuk accommodate video
    files: 15, // Maximum 15 files
  },
});

// image
const uploadSingleImage = (fieldName) => imageUploader.single(fieldName);
const uploadMultipleImages = (fieldName, maxCount) =>
  imageUploader.array(fieldName, maxCount);
const uploadFields = (fieldsConfig) => imageUploader.fields(fieldsConfig);

// video
const uploadSingleVideo = (fieldName) => videoUploader.single(fieldName);
const uploadMultipleVideos = (fieldName = "videos", maxCount = 3) =>
  videoUploader.array(fieldName, maxCount);

const uploadImageAndVideo = () => {
  return combinedUploader.fields([
    { name: "foodImage", maxCount: 1 },
    { name: "foodVideo", maxCount: 1 },
  ]);
};

const uploadMultipleImageAndVideo = () => {
  return combinedUploader.fields([
    { name: "foodImage", maxCount: 5 },
    { name: "foodVideo", maxCount: 3 },
  ]);
};

app.use("/public", express.static("public"));

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  uploadFields,
  uploadSingleVideo,
  uploadMultipleVideos,
  uploadImageAndVideo,
  uploadMultipleImageAndVideo,
};
