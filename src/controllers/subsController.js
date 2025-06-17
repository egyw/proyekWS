const { Subscriptions } = require("../models");

const getSubscription = async (req, res) => {
    const { userId, type } = req.body;
    
    if (!userId || !type) {
        return res.status(400).json({ message: "User ID and subscription type are required." });
    }
    
    try {

        const finduser = await Subscriptions.findOne({ userId });

        if(finduser){
            return res.status(400).json({ message: "User already has a subscription." });
        }

        const newSubscription = new Subscriptions({
        userId,
        type,
        startDate: null,
        endDate: null,
        paymentStatus: "pending",
        });
    
        await newSubscription.save();
        return res.status(201).json({ message: "Subscription created successfully.", subscription: newSubscription });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const buySubscription = async (req, res) => {
    const { userId, type, paymentDetails } = req.body;

    if (!userId || !type || !paymentDetails) {
        return res.status(400).json({ message: "User ID, subscription type, and payment details are required." });
    }

    try {
        const subscription = await Subscriptions.findOne({ userId, type, paymentStatus: "pending" });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        subscription.startDate = new Date();
        subscription.endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        subscription.paymentStatus = "completed";

        await subscription.save();
        return res.status(200).json({ message: "Subscription purchased successfully.", subscription });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const cekSubscriptionStatus = async (req, res) => {
    const { userId, type } = req.query;

    if (!userId || !type) {
        return res.status(400).json({ message: "User ID and subscription type are required." });
    }

    try {
        const subscription = await Subscriptions.findOne({ userId, type });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        return res.status(200).json({ message: "Subscription status retrieved successfully.", subscription });
    } catch (error) {
        console.error("Error retrieving subscription status:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const cancelSubscription = async (req, res) => {
    const { userId, type } = req.body;

    if (!userId || !type) {
        return res.status(400).json({ message: "User ID and subscription type are required." });
    }

    try {
        const subscription = await Subscriptions.findOne({ userId, type });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        subscription.paymentStatus = "cancelled";
        await subscription.save();

        return res.status(200).json({ message: "Subscription cancelled successfully.", subscription });
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const webHookSubscription = async (req, res) => {};
const getRecommendation = async (req, res) => {};
const getAlternativeIngredients = async (req, res) => {};


module.exports = {
  getSubscription,
  buySubscription,
  cekSubscriptionStatus,
  cancelSubscription,
  webHookSubscription,
  getRecommendation,
  getAlternativeIngredients,
};
