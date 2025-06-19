const express = require("express");
const path = require("path");
const verifyToken = require("../middlewares/authMiddleware");
const {
  addComentar,
  getListReview,
  foodSugestion,
  aiHistory,
  countCalory,
} = require("../controllers/RacController");
const cekPremium = require("../middlewares/cekRole");
const router = express.Router();

router.post("/addComentar/:recipeID", [verifyToken], addComentar);
router.post("/ai/food-suggestion", [verifyToken, cekPremium], foodSugestion);
router.get("/ai/history", [verifyToken], aiHistory);
router.get("/ai/calory/:title", [verifyToken], countCalory);
router.get("/:title", [verifyToken], getListReview);

module.exports = router;
