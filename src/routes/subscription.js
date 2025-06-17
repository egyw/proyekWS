const express = require("express");
const {
    getSubscription,
    buySubscription,
    cekSubscriptionStatus,
    cancelSubscription,
    webHookSubscription,
    getRecommendation,
    getAlternativeIngredients,
} = require("../controllers/subsController");
const verifyToken = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/subscribe", [verifyToken], getSubscription);
router.post("/paySubscription", [verifyToken], buySubscription);
router.get("/subscription/status", [verifyToken], cekSubscriptionStatus);
router.delete("/unsubscribe", [verifyToken], cancelSubscription);
router.get("/payment/webhook", [verifyToken], webHookSubscription);
router.get("/recommendations", [verifyToken], getRecommendation);
router.get("/ingredients/alternative", [verifyToken], getAlternativeIngredients);
module.exports = router;
