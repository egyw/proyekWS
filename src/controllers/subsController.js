const { Subscriptions, Transaction, DetailTrans, User } = require("../models");
const axios = require('axios');
const { query } = require("../utils/spoonacular/listFoodTypeSpoonacular");

const getSubscription = async (req, res) => {
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }
    
    try {

        const finduser = await Subscriptions.findOne({ userId });

        if(finduser){
            return res.status(400).json({ message: "User already has a subscription." });
        }

        const newSubscription = new Subscriptions({
        userId,
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
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const subscription = await Subscriptions.findOne({ userId, paymentStatus: "pending" });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        subscription.startDate = new Date();
        subscription.endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        subscription.paymentStatus = "completed";

        await subscription.save();
        
        const transaction = {
            date: new Date(),
            username: userId,
            type: "premium",
            total_amount: paymentDetails.amount,
        };

        await Transaction.create(transaction);

        return res.status(200).json({ message: "Subscription purchased successfully.", subscription });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const cekSubscriptionStatus = async (req, res) => {
    const { userId } = req.query;

    if (!userId || !type) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const subscription = await Subscriptions.findOne({ userId });

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
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const subscription = await Subscriptions.findOne({ userId });

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
const topup = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
        return res.status(400).json({ message: "User ID and amount are required." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.saldo += amount;
        await user.save();

        return res.status(200).json({ message: "Top-up successful.", balance: user.saldo });
    } catch (error) {
        console.error("Error during top-up:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const fetchItemDetail = async (itemId) => {
    try {
        const options = {
            method: "GET",
            url: `https://api.spoonacular.com/food/ingredients/${itemId}/information`,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.SPOONACULAR_API_KEY,
            },
            params: {
                amount: 1
            }
        };
        const response = await axios.request(options);
        if (response.status !== 200 || !response.data) return null;
        
        const cost = response.data.estimatedCost;
        return {
            id: response.data.id,
            name: response.data.name,
            price: cost ? cost.value : null
        };
    } catch (err) {
        console.error(`Gagal mengambil detail untuk item ID: ${itemId}`, err.message);
        return null;
    }
};
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const getAllItemDetails = async (req, res) => {
    try {

        const searchQueries = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'v', 'w'];
        
        const shuffledQueries = shuffleArray([...searchQueries]);
        const queriesToRun = shuffledQueries.slice(0, 5); 

        const itemsPerQuery = 5;

        const searchPromises = queriesToRun.map(query => {
            return axios.request({
                method: "GET",
                url: "https://api.spoonacular.com/food/ingredients/search",
                headers: { "x-api-key": process.env.SPOONACULAR_API_KEY },
                params: {
                    query: query,
                    number: itemsPerQuery
                }
            });
        });

        const searchResponses = await Promise.all(searchPromises);

        let combinedIngredients = [];
        searchResponses.forEach(response => {
            if (response.data && response.data.results) {
                combinedIngredients.push(...response.data.results);
            }
        });

        let finalIngredientsList = shuffleArray(combinedIngredients);

        finalIngredientsList = finalIngredientsList.slice(0, 20);

        const ingredientDetails = await Promise.all(
            finalIngredientsList.map(async (ingredient) => {
                const itemDetails = await fetchItemDetail(ingredient.id);
                if (itemDetails && itemDetails.price !== null) {
                    return {
                        id: itemDetails.id,
                        name: itemDetails.name,
                        price: itemDetails.price
                    };
                }
                return null;
            })
        );

        return res.status(200).json({ ingredients: ingredientDetails });
    } catch (error) {
        if (error.response) {
            console.error("Error dari Spoonacular API:", error.response.data);
            return res.status(error.response.status).json({ 
                message: error.response.data.message || "Gagal mengambil detail bahan dari Spoonacular." 
            });
        }
        console.error("Error internal server:", error.message);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};
const getItemDetailsByName = async (req, res) => {
    const { name } = req.params;
    if (!name) {
        return res.status(400).json({ message: "Item name is required." });
    }   
    try {
        const options = {
            method: "GET",
            url: "https://api.spoonacular.com/food/ingredients/search",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.SPOONACULAR_API_KEY,
            },
            params: {
                query: name,
                number: 20
            }
        };
        const response = await axios.request(options);
        if (response.status !== 200 || !response.data || response.data.results.length === 0) {
            return res.status(404).json({ message: "Item not found." });
        }
        const items = await Promise.all(response.data.results.map(async (item) => {
            const itemDetails = await fetchItemDetail(item.id);
            if (itemDetails && itemDetails.price !== null) {
                return {
                    id: itemDetails.id,
                    name: itemDetails.name,
                    price: itemDetails.price
                };
            }
            return null;
        }));
        const filteredItems = items.filter(item => item !== null);
        if (filteredItems.length === 0) {
            return res.status(404).json({ message: "No items found with the given name." });
        }
        return res.status(200).json({ items: filteredItems });
    } catch (error) {
        console.error("Error fetching item details:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const addItemtoCart = async (req, res) => {
    const { userId, itemId, quantity } = req.body;

    if (!userId || !itemId || !quantity) {
        return res.status(400).json({ message: "User ID, item ID, and quantity are required." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.cart) {
            user.cart = [];
        }

        const itemDetails = await fetchItemDetail(itemId);
        if (!itemDetails || !itemDetails.price) {
            return res.status(404).json({ message: "Item not found or price unavailable." });
        }
        const item_name = itemDetails.name;
        const price = itemDetails.price * quantity;
        user.cart.push({
            item_name,
            quantity,
            price,
        });
        await user.save();

        return res.status(200).json({ message: "Item added to cart successfully.", cart: user.cart });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const buyItem = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.cart || user.cart.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }

        let totalAmount = 0;
        const detailTrans = [];

        for (const item of user.cart) {
            const item_name = item.item_name;
            const quantity = item.quantity;
            const price = item.price;
            totalAmount += price;
            detailTrans.push({
                transaction_id: null, 
                item_name,
                quantity,
                price,
            });
        }
        const transaction = new Transaction({
            date: new Date(),
            username: userId,
            type: "item",
            total_amount: totalAmount,
        });
        await transaction.save();
        for (const detail of detailTrans) {
            detail.transaction_id = transaction._id; 
            await DetailTrans.create(detail);
        }
        user.cart = [];
        await user.save();
        return res.status(200).json({ message: "Items purchased successfully.", transaction });
    } catch (error) {
        console.error("Error buying items:", error);
        return res.status(500).json({ message: "Internal server error." });
    }  
};


module.exports = {
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
};
