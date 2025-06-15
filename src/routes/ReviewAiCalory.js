const express = require("express");
const path = require("path");
const verifyToken = require("../middlewares/authMiddleware");
const {
  addComentar,
  getListReview,
  foodSugestion,
} = require("../controllers/RacController");
const cekPremium = require("../middlewares/cekRole");
const router = express.Router();

router.post("/:title/:commentar/:rating", [verifyToken], addComentar);
router.post("/ai/food-suggestion", [verifyToken, cekPremium], foodSugestion);
router.get("/:title", [verifyToken], getListReview);

module.exports = router;
