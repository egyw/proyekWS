const { faker } = require("@faker-js/faker");
const { Subscriptions, User, Cart } = require("../models");
const { aiQueries } = require("../models");
const { DetailTrans, Transaction } = require("../models");
const { Review } = require("../models");
const { Recipe } = require("../models");
const { FailedLoginAttempt } = require("../models");
const { IpBan } = require("../models");
const { Log } = require("../models");

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Subscriptions.deleteMany({});
    await aiQueries.deleteMany({});
    await Cart.deleteMany({});
    await DetailTrans.deleteMany({});
    await Review.deleteMany({});
    await Recipe.deleteMany({});
    await FailedLoginAttempt.deleteMany({});
    await IpBan.deleteMany({});
    await Log.deleteMany({});

    // 1. Seed Users
    const users = [];
    for (let i = 0; i < 50; i++) {
      users.push({
        profilePicture: faker.datatype.boolean()
          ? faker.image.avatar()
          : "null",
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: faker.helpers.arrayElement(["user", "admin"]),
        isPremium: faker.datatype.boolean(),
        saldo: faker.number.int({ min: 0, max: 1000000 }), // Changed
        refreshToken: faker.datatype.boolean() ? faker.string.uuid() : null, // Changed
        pendingEmail: faker.datatype.boolean() ? faker.internet.email() : null,
        otp: faker.datatype.boolean()
          ? faker.number.int({ min: 100000, max: 999999 }).toString() // Changed
          : null,
        otpExpiresAt: faker.datatype.boolean() ? faker.date.future() : null,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      });
    }
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // 2. Seed Subscriptions
    const subscriptions = [];
    for (let i = 0; i < 20; i++) {
      subscriptions.push({
        userId: faker.helpers.arrayElement(createdUsers)._id.toString(),
        startDate: faker.datatype.boolean() ? faker.date.past() : null,
        endDate: faker.datatype.boolean() ? faker.date.future() : null,
        paymentStatus: faker.helpers.arrayElement([
          "pending",
          "completed",
          "cancelled",
        ]),
        status: faker.helpers.arrayElement(["active", "expired", "cancelled"]),
      });
    }
    const createdSubscriptions = await Subscriptions.insertMany(subscriptions);
    console.log(`Created ${createdSubscriptions.length} subscriptions`);

    // 3. Seed Recipes
    const recipes = [];
    const dishTypesList = [
      "main course",
      "side dish",
      "dessert",
      "appetizer",
      "salad",
      "bread",
      "breakfast",
      "soup",
      "beverage",
      "sauce",
      "marinade",
      "fingerfood",
      "snack",
      "drink",
    ];
    const areasList = [
      "American",
      "Italian",
      "Chinese",
      "Mexican",
      "Indian",
      "Japanese",
      "French",
      "Thai",
      "Greek",
      "Spanish",
      "Turkish",
      "Lebanese",
      "Korean",
    ];
    const tagsList = [
      "vegetarian",
      "vegan",
      "gluten-free",
      "dairy-free",
      "keto",
      "low-carb",
      "high-protein",
      "spicy",
      "sweet",
      "savory",
    ];

    for (let i = 0; i < 100; i++) {
      const ingredientsCount = faker.number.int({ min: 3, max: 10 }); // Changed
      const ingredients = [];
      for (let j = 0; j < ingredientsCount; j++) {
        ingredients.push({
          name: faker.commerce.productMaterial(),
          measure: faker.helpers.arrayElement([
            "1 cup",
            "2 cups",
            "1/2 cup",
            "1/4 cup",
            "1 tbsp",
            "2 tbsp",
            "1 tsp",
            "2 tsp",
            "1 piece",
            "2 pieces",
            "1 lb",
            "500g",
            "200ml",
            "1 clove",
            "to taste",
          ]),
        });
      }

      recipes.push({
        title: faker.commerce.productName(),
        servings: faker.number.int({ min: 1, max: 8 }), // Changed
        readyInMinutes: faker.number.int({ min: 15, max: 180 }), // Changed
        preparationMinutes: faker.number.int({ min: 5, max: 60 }), // Changed
        cookingMinutes: faker.number.int({ min: 10, max: 120 }), // Changed
        ingredients: ingredients,
        dishTypes: faker.helpers.arrayElement(dishTypesList),
        tags: faker.helpers
          .arrayElements(tagsList, faker.number.int({ min: 1, max: 3 })) // Changed
          .join(", "),
        area: faker.helpers.arrayElement(areasList),
        instructions: faker.lorem.paragraphs(2),
        video: faker.datatype.boolean() ? faker.internet.url() : null,
        createdByUser: faker.helpers.arrayElement(createdUsers)._id,
        dateModified: faker.datatype.boolean() ? faker.date.recent() : null,
        image: faker.datatype.boolean()
          ? `/images/food/${faker.lorem.word()}_${faker.number.int({ min: 1, max: 1000 })}.${faker.helpers.arrayElement(["jpg", "png", "webp"])}`
          : null,
        healthScore: faker.datatype.boolean()
          ? faker.number.int({ min: 1, max: 100 }) // Changed
          : null,
        summary: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
        weightWatcherSmartPoints: faker.datatype.boolean()
          ? faker.number.int({ min: 1, max: 20 }) // Changed
          : null,
        calories: faker.datatype.boolean()
          ? faker.number.int({ min: 100, max: 800 }) // Changed
          : null,
        carbs: faker.datatype.boolean()
          ? `${faker.number.int({ min: 10, max: 100 })}g` // Changed
          : null,
        fat: faker.datatype.boolean()
          ? `${faker.number.int({ min: 5, max: 50 })}g` // Changed
          : null,
        protein: faker.datatype.boolean()
          ? `${faker.number.int({ min: 5, max: 60 })}g` // Changed
          : null,
      });
    }
    const createdRecipes = await Recipe.insertMany(recipes);
    console.log(`Created ${createdRecipes.length} recipes`);

    // 4. Seed Transactions
    const transactions = [];
    for (let i = 0; i < 75; i++) {
      transactions.push({
        date: faker.date.past(),
        user_id: faker.helpers.arrayElement(createdUsers)._id.toString(),
        type: faker.helpers.arrayElement(["item", "premium"]),
        total_amount: faker.number.int({ min: 1000, max: 500000 }), // Changed
      });
    }
    const createdTransactions = await Transaction.insertMany(transactions);
    console.log(`Created ${createdTransactions.length} transactions`);

    // 5. Seed DetailTrans
    const detailTrans = [];
    for (let i = 0; i < 100; i++) {
      detailTrans.push({
        transaction_id: faker.helpers.arrayElement(createdTransactions)._id,
        item_name: faker.commerce.productName(),
        quantity: faker.number.int({ min: 1, max: 5 }), // Changed
        price: faker.number.int({ min: 5000, max: 250000 }), // Changed
      });
    }
    const createdDetailTrans = await DetailTrans.insertMany(detailTrans);
    console.log(`Created ${createdDetailTrans.length} detail transactions`);

    // 6. Seed Cart
    const carts = [];
    for (let i = 0; i < 60; i++) {
      carts.push({
        user: faker.helpers.arrayElement(createdUsers)._id,
        item_name: faker.commerce.productName(),
        price: faker.number.int({ min: 5000, max: 250000 }), // Changed
        quantity: faker.number.int({ min: 1, max: 10 }), // Changed
      });
    }
    const createdCarts = await Cart.insertMany(carts);
    console.log(`Created ${createdCarts.length} cart items`);

    // 7. Seed Reviews
    const reviews = [];
    for (let i = 0; i < 150; i++) {
      const selectedRecipe = faker.helpers.arrayElement(createdRecipes);
      const selectedUser = faker.helpers.arrayElement(createdUsers);

      reviews.push({
        recipeId: selectedRecipe._id,
        recipeTitle: selectedRecipe.title,
        commentedBy: selectedUser._id,
        commentedByUsername: selectedUser.username,
        comment: faker.lorem.paragraph(),
        rating: faker.number.int({ min: 1, max: 5 }), // Changed
      });
    }
    const createdReviews = await Review.insertMany(reviews);
    console.log(`Created ${createdReviews.length} reviews`);

    // 8. Seed AI Queries
    const aiQueriesData = [];
    for (let i = 0; i < 80; i++) {
      aiQueriesData.push({
        userId: faker.helpers.arrayElement(createdUsers)._id.toString(),
        prompt: faker.lorem.sentence(),
        response: faker.lorem.paragraphs(2),
      });
    }
    const createdAiQueries = await aiQueries.insertMany(aiQueriesData);
    console.log(`Created ${createdAiQueries.length} AI queries`);

    // 9. Seed Failed Login Attempts
    const failedAttempts = [];
    for (let i = 0; i < 30; i++) {
      const timestampsCount = faker.number.int({ min: 1, max: 5 }); // Changed
      const timestamps = [];
      for (let j = 0; j < timestampsCount; j++) {
        timestamps.push(faker.date.past());
      }

      failedAttempts.push({
        identifier: faker.datatype.boolean()
          ? faker.internet.email()
          : faker.internet.userName(),
        ipAddress: faker.internet.ip(),
        timestamps: timestamps,
        lockUntil: faker.datatype.boolean() ? faker.date.future() : null,
      });
    }
    const createdFailedAttempts =
      await FailedLoginAttempt.insertMany(failedAttempts);
    console.log(
      `Created ${createdFailedAttempts.length} failed login attempts`
    );

    // 10. Seed IP Bans
    const ipBans = [];
    for (let i = 0; i < 15; i++) {
      const timeoutHistoryCount = faker.number.int({ min: 1, max: 5 }); // Changed
      const timeoutHistory = [];
      for (let j = 0; j < timeoutHistoryCount; j++) {
        timeoutHistory.push(faker.date.past());
      }

      ipBans.push({
        ipAddress: faker.internet.ip(),
        isBanned: faker.datatype.boolean(),
        timeoutHistory: timeoutHistory,
        reason: faker.helpers.arrayElement([
          "Terlalu banyak percobaan login gagal.",
          "Aktivitas mencurigakan terdeteksi.",
          "Spam atau abuse terdeteksi.",
          "Pelanggaran terms of service.",
          "Brute force attack attempt.",
        ]),
      });
    }
    const createdIpBans = await IpBan.insertMany(ipBans);
    console.log(`Created ${createdIpBans.length} IP bans`);

    // 11. Seed Logs
    const logs = [];
    for (let i = 0; i < 200; i++) {
      logs.push({
        userId: faker.helpers.arrayElement(createdUsers)._id,
        action: faker.helpers.arrayElement([
          "REGISTER",
          "LOGIN_OTP_DIKIRIM",
          "LOGIN_GAGAL",
          "LOGIN_BERHASIL",
          "LOGOUT",
          "GANTI_PASSWORD",
          "GANTI_EMAIL_REQUEST",
          "GANTI_EMAIL_GAGAL",
          "GANTI_EMAIL_BERHASIL",
          "REFRESH_TOKEN",
          "UPDATE_ROLE",
        ]),
        status: faker.helpers.arrayElement(["BERHASIL", "GAGAL"]),
        ipAddress: faker.internet.ip(),
        details: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      });
    }
    const createdLogs = await Log.insertMany(logs);
    console.log(`Created ${createdLogs.length} logs`);

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};
// node runSeeder.js
module.exports = { seedData };
