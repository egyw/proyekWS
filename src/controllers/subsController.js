const { Subscriptions, Transaction, DetailTrans, User, aiQueries, Recipe, Cart } = require("../models");
const axios = require('axios');
const { query } = require("../utils/spoonacular/listFoodTypeSpoonacular");

const getSubscription = async (req, res) => {
    const userId = req.user.id;
    
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }
    
    try {

        const finduser = await Subscriptions.findOne({ userId, paymentStatus: { $in: ["completed", "pending"] }, status: { $in: ["active", null] } });

        if(finduser){
            return res.status(400).json({ message: "User already has a subscription." });
        }

        const newSubscription = new Subscriptions({
        userId,
        startDate: null,
        endDate: null,
        paymentStatus: "pending",
        status: null,
        });
    
        await newSubscription.save();
        return res.status(201).json({ message: "Subscription created successfully. Please pay $9.99", subscription: newSubscription });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const buySubscription = async (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const subscription = await Subscriptions.findOne({ userId, paymentStatus: "pending" });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        if(user.saldo < 9.99){
            return res.status(400).json({ message: "Insufficient balance for subscription." });
        }

        user.saldo -= 9.99;

        subscription.startDate = new Date();
        subscription.endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
        subscription.paymentStatus = "completed";
        subscription.status = "active";

        await subscription.save();
        
        const transaction = {
            date: new Date(),
            user_id: userId,
            type: "premium",
            total_amount: 9.99,
        };

        await Transaction.create(transaction);

        user.isPremium = true;
        await user.save();

        return res.status(200).json({ message: "Subscription purchased successfully.", subscription });
    } catch (error) {
        console.error("Error processing payment:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const cekSubscriptionStatus = async (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const subscription = await Subscriptions.find({ userId });

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
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const subscription = await Subscriptions.findOne({ userId, paymentStatus: { $in: ["completed", "pending"] }, status: { $in: ["active", null] } });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        if (subscription.paymentStatus == "completed") {
            subscription.status = "cancelled";
        }
        if( subscription.paymentStatus == "pending") {
            subscription.paymentStatus = "cancelled";
        }
        await subscription.save();

        user.isPremium = false;
        await user.save();

        return res.status(200).json({ message: "Subscription cancelled successfully.", subscription });
    } catch (error) {
        console.error("Error cancelling subscription:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};
const getRecommendation = async (req, res) => {
    const userId = req.user.id;
    let userInput = req.body.userInput;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }
    if (!userInput || userInput.length === 0) {
        return res.status(400).json({ message: "User input (ingredients) is required." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        let localRecipes = [];
        if (typeof userInput === 'string') {
            userInput = userInput.split(',').map(i => i.trim());
        }
        
        if (typeof Recipe !== "undefined") {
            const regexUserInput = userInput.map(item => new RegExp(item, 'i'));

            localRecipes = await Recipe.find({
                "ingredients.name": { $all: regexUserInput }
            }).limit(5);
        }

        const spoonacularRes = await axios.get(
            "https://api.spoonacular.com/recipes/complexSearch",
            {
                params: {
                    includeIngredients: userInput.join(','),
                    number: 5,
                    addRecipeInformation: true,
                    apiKey: process.env.SPOONACULAR_API_KEY
                }
            }
        );
        const spoonacularRecipes = (spoonacularRes.data.results || []).map(r => ({
            title: r.title,
            image: r.image,
            cuisine: r.cuisines,
            sourceUrl: r.sourceUrl
        }));

        const result = [
            ...localRecipes.map(r => ({
                title: r.title,
                image: r.image,
                cuisine: r.cuisine || [],
                source: "local"
            })),
            ...spoonacularRecipes.map(r => ({
                ...r,
                source: "spoonacular"
            }))
        ];

        return res.status(200).json({
            message: "Recommendation generated successfully.",
            recommendations: result
        });
    } catch (error) {
        console.error("Error generating recommendation:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const getAlternativeIngredients = async (req, res) => {
    const userId = req.user.id;
    const userInput = req.body.userInput;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }
    if (!userInput || userInput.length === 0) {
        return res.status(400).json({ message: "User input (food name) is required." });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        let localIngredients = [];
        if (typeof Recipe !== "undefined") {
            const localRecipe = await Recipe.findOne({ title: { $regex: new RegExp(userInput, 'i') } });
            if (localRecipe && Array.isArray(localRecipe.ingredients)) {
                localIngredients = localRecipe.ingredients.map(i => (i.name ? i.name : i));
            }
        }
        let spoonacularIngredients = [];
        try {
            const cleanUserInput = userInput.trim().toLowerCase();
            const apiKey = process.env.SPOONACULAR_API_KEY;
            const searchResponse = await axios.get("https://api.spoonacular.com/recipes/complexSearch", { params: { query: cleanUserInput, number: 1, apiKey: apiKey } });
            const recipeResult = searchResponse.data.results?.[0];
            if (recipeResult) {
                const recipeId = recipeResult.id;
                const detailsResponse = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, { params: { includeNutrition: false, apiKey: apiKey } });
                const fullRecipeDetails = detailsResponse.data;
                if (fullRecipeDetails && fullRecipeDetails.extendedIngredients) {
                    spoonacularIngredients = fullRecipeDetails.extendedIngredients.map(i => i.name);
                }
            }
        } catch (err) {
            console.error("[ERROR] Spoonacular communication failed:", err.message);
        }
        const allIngredients = Array.from(new Set([...localIngredients, ...spoonacularIngredients]));

        if (allIngredients.length === 0) {
            return res.status(404).json({ message: "No ingredients found for this food." });
        }

        const aiPrompt = `
                            Given the following list of ingredients for the food "${userInput}":
                            ${allIngredients.map(i => `- ${i}`).join('\n')}
                            For each ingredient, suggest at least one alternative ingredient. 
                            Format the response as a JSON array of objects with "original" and "alternative" fields. ONLY return the JSON array.
                            Example:
                            [
                            { "original": "egg", "alternative": "chia seeds" },
                            { "original": "milk", "alternative": "soy milk" }
                            ]
                        `;
        
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: aiPrompt }] }],
                    generationConfig: { response_mime_type: "application/json" }
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json().catch(() => geminiResponse.text());
            return res.status(500).json({ message: "Error communicating with AI service.", error: errorBody });
        }

        const geminiResult = await geminiResponse.json();
        const textResponse = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
             return res.status(500).json({ message: "AI returned an empty response." });
        }

        let alternativesArray;
        try {
            alternativesArray = JSON.parse(textResponse);
        } catch (e) {
            return res.status(500).json({ message: "AI generated a response, but it was not in a valid JSON format.", rawResponse: textResponse });
        }

        if (!Array.isArray(alternativesArray) || alternativesArray.length === 0) {
            return res.status(404).json({ message: "AI could not generate any alternative ingredients." });
        }
        
        const aiQueriesEntry = new aiQueries({
            userId: userId,
            prompt: aiPrompt,
            response: JSON.stringify(alternativesArray)
        });
        await aiQueriesEntry.save();

        return res.status(200).json({
            food: userInput,
            ingredient: alternativesArray
        });

    } catch (error) {
        console.error("Error in getAlternativeIngredients function:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const topup = async (req, res) => {
    const userId = req.user.id;
    let amount = req.body.amount;

    amount = parseFloat(amount);

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
    let { itemId, quantity } = req.body;
    const userId = req.user.id;

    if (!userId || !itemId || !quantity) {
        return res.status(400).json({ message: "User ID, item ID, and quantity are required." });
    }

    try {
        const user = await User.findById(userId);
        quantity = parseInt(quantity);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (quantity <= 0) {
            return res.status(400).json({ message: "Quantity must be greater than zero." });
        }

        const itemDetails = await fetchItemDetail(itemId);
        if (!itemDetails || !itemDetails.price) {
            return res.status(404).json({ message: "Item not found or price unavailable." });
        }
        const item_name = itemDetails.name;
        const item_price = itemDetails.price;

        let cartItem = await Cart.findOne({ user: userId, item_name });

        if (cartItem) {
            cartItem.quantity += quantity;
            cartItem.price += item_price * quantity;
            await cartItem.save();
        } else {
            cartItem = new Cart({
                user: userId,
                item_name,
                price: item_price * quantity,
                quantity: quantity
            });
            await cartItem.save();
        }
        const userCart = await Cart.find({ user: userId });

        const simpleCart = userCart.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price
        }));

        return res.status(200).json({ message: "Item added to cart successfully.", cart: simpleCart });
    } catch (error) {
        console.error("Error adding item to cart:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const viewCart = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }
    try {
        const userCart = await Cart.find({ user: userId });
        if (!userCart || userCart.length === 0) {
            return res.status(200).json({ message: "Cart is empty." });
        }

        const simpleCart = userCart.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price
        }));
        return res.status(200).json({ message: "Cart retrieved successfully.", cart: simpleCart });
    } catch (error) {
        console.error("Error retrieving cart:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const removeItemFromCart = async (req, res) => {
    const userId = req.user.id;
    const item_name = req.body.item_name;
    if (!userId || !item_name) {
        return res.status(400).json({ message: "User ID and item name are required." });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const deleted = await Cart.findOneAndDelete({ user: userId, item_name });
        if (!deleted) {
            return res.status(404).json({ message: "Item not found in cart." });
        }

        const userCart = await Cart.find({ user: userId });

        const simpleCart = userCart.map(item => ({
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price
        }));

        return res.status(200).json({ message: "Item removed from cart successfully.", cart: simpleCart });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const removeAllItemFromCart = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const cartItems = await Cart.find({ user: userId });
        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Cart is already empty." });
        }

        await Cart.deleteMany({ user: userId });

        return res.status(200).json({ message: "All items removed from cart successfully.", cart: [] });
    } catch (error) {
        console.error("Error removing all items from cart:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};

const buyItem = async (req, res) => {
    const userId = req.user.id;

    if (!userId) {
        return res.status(400).json({ message: "User ID is required." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const userCart = await Cart.find({ user: userId });
        if (!userCart || userCart.length === 0) {
            return res.status(400).json({ message: "Cart is empty." });
        }

        let totalAmount = 0;
        const detailTrans = [];

        for (const item of userCart) {
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

        if (user.saldo < totalAmount) {
            return res.status(400).json({ message: "Insufficient balance for purchase." });
        }

        user.saldo -= totalAmount;
        await user.save();

        const transaction = new Transaction({
            date: new Date(),
            user_id: userId,
            type: "item",
            total_amount: totalAmount,
        });
        await transaction.save();

        for (const detail of detailTrans) {
            detail.transaction_id = transaction._id; 
            await DetailTrans.create(detail);
        }

        await Cart.deleteMany({ user: userId });

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
  getRecommendation,
  getAlternativeIngredients,
  topup,
  getAllItemDetails,
  getItemDetailsByName,
  addItemtoCart,
  viewCart,
  removeItemFromCart,
  removeAllItemFromCart,
  buyItem,
};
