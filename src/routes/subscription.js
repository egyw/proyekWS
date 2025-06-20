const express = require("express");
const {
    getSubscription,
    buySubscription,
    cekSubscriptionStatus,
    cancelSubscription,
    webHookSubscription,
    getRecommendation,
    getAlternativeIngredients,
    topup,
    getAllItemDetails,
    getItemDetailsByName,
    addItemtoCart,
    buyItem,
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
router.post("/topup", [verifyToken], topup);
router.get("/item/details", getAllItemDetails);
router.get("/item/details/:name", getItemDetailsByName);
router.post("/cart/add", [verifyToken], addItemtoCart);
router.post("/item/buy", [verifyToken], buyItem);

module.exports = router;
