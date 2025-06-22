const express = require("express");
const path = require("path");
const verifyToken = require("../middlewares/authMiddleware");
const {
  addComentar,
  getListReview,
  foodSugestion,
  aiHistory,
  countCalory,
  exportToPDF,
  exportInfoToExcel,
} = require("../controllers/RacController");
const cekPremium = require("../middlewares/cekRole");
const router = express.Router();

router.post("/addComentar/:id", [verifyToken], addComentar);
router.post("/ai/food-suggestion", [verifyToken, cekPremium], foodSugestion);
router.get("/spoonExcel/information", [verifyToken], exportInfoToExcel);
router.get("/ai/history/export", [verifyToken], exportToPDF);
router.get("/ai/history", [verifyToken], aiHistory);
router.get("/ai/calory/:title", [verifyToken], countCalory);
router.get("/:id", [verifyToken], getListReview);

module.exports = router;
