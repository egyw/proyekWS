const express = require("express");
const {
    getSubscription,
    buySubscription,
    cekSubscriptionStatus,
    cancelSubscription,
    getRecommendation,
    getAlternativeIngredients,
    topup,
    getAllItemDetails,
    getItemDetailsByName,
    addItemtoCart,
    buyItem,
} = require("../controllers/subsController");
const verifyToken = require("../middlewares/authMiddleware");
const premium = require("../middlewares/cekRole");
const router = express.Router();

router.post("/subscribe", [verifyToken], getSubscription);
router.post("/paySubscription", [verifyToken], buySubscription);
router.get("/subscription/status", [verifyToken], cekSubscriptionStatus);
router.delete("/unsubscribe", [verifyToken], cancelSubscription);
router.get("/recommendations", [verifyToken, premium], getRecommendation);
router.get("/ingredients/alternative", [verifyToken, premium], getAlternativeIngredients);
router.post("/topup", [verifyToken], topup);
router.get("/item/details", [verifyToken], getAllItemDetails);
router.get("/item/details/:name", [verifyToken], getItemDetailsByName);
router.post("/cart/add", [verifyToken], addItemtoCart);
router.post("/item/buy", [verifyToken], buyItem);

module.exports = router;
