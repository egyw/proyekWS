const mongoose = require('mongoose');
require('dotenv').config();
const { faker } = require('@faker-js/faker/locale/id_ID');

const User = require('./src/models/User');
const Recipe = require('./src/models/Recipe');
const Review = require('./src/models/Review');
const Transaction = require('./src/models/Transaction');
const DetailTrans = require('./src/models/Detail_trans');
const Cart = require('./src/models/Cart');
const AiQueries = require('./src/models/aiQueries');
const Subscriptions = require('./src/models/Subscriptions');
const Log = require('./src/models/Log');
const FailedLoginAttempt = require('./src/models/FailedLoginAttempt');
const IpBan = require('./src/models/IpBan');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err.message);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Cart.deleteMany();
        await DetailTrans.deleteMany();
        await Review.deleteMany();
        await Log.deleteMany();
        await AiQueries.deleteMany();
        await FailedLoginAttempt.deleteMany();
        await IpBan.deleteMany();
        await Subscriptions.deleteMany();
        await Transaction.deleteMany();
        await Recipe.deleteMany();
        await User.deleteMany();
        console.log('🔥 Data Destroyed Successfully!');
    } catch (error) {
        console.error('Error destroying data:', error);
    }
};

const importData = async () => {
    try {
        await destroyData();

        const NUM_USERS = 15;
        const NUM_RECIPES = 25;
        const NUM_TRANSACTIONS = 20;

        // usersData ============================================================================================================
        const usersData = [];
        for (let i = 0; i < NUM_USERS; i++) {
            usersData.push({
                profilePicture: faker.image.avatar(),
                username: faker.internet.username().toLowerCase() + faker.string.numeric(2),
                email: faker.internet.email().toLowerCase(),
                password: 'hashed_password_placeholder',
                role: i < 2 ? 'admin' : 'user',
                isPremium: faker.datatype.boolean(),
                saldo: faker.finance.amount({ min: 0, max: 500000, dec: 0 }),
            });
        }
        const createdUsers = await User.insertMany(usersData);
        console.log(`${createdUsers.length} users created.`);

        // recipesData ============================================================================================================
        const recipesData = [];
        for (let i = 0; i < NUM_RECIPES; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers);
            const prepTime = faker.number.int({ min: 10, max: 30 });
            const cookTime = faker.number.int({ min: 15, max: 60 });
            recipesData.push({
                title: faker.food.dish(),
                servings: faker.number.int({ min: 1, max: 6 }),
                readyInMinutes: prepTime + cookTime,
                preparationMinutes: prepTime,
                cookingMinutes: cookTime,
                ingredients: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
                    name: faker.food.ingredient(),
                    measure: `${faker.number.int({ min: 1, max: 200 })} ${faker.helpers.arrayElement(['gram', 'ml', 'sdm', 'sdt', 'buah'])}`,
                })),
                dishTypes: faker.helpers.arrayElement(['main course', 'dessert', 'appetizer', 'soup']),
                tags: faker.lorem.words(3).replace(/ /g, ', '),
                area: faker.location.country(),
                instructions: faker.lorem.paragraphs(3),
                createdByUser: randomUser._id,
                image: faker.image.urlLoremFlickr({ category: 'food' }),
                calories: faker.number.int({ min: 200, max: 1200 }),
            });
        }
        const createdRecipes = await Recipe.insertMany(recipesData);
        console.log(`${createdRecipes.length} recipes created.`);

        // cartsData ============================================================================================================
        const cartsData = [];
        for (let i = 0; i < 20; i++) { // Buat 20 item di keranjang untuk user yang berbeda
            const randomUser = faker.helpers.arrayElement(createdUsers);
            cartsData.push({
                user: randomUser._id,
                item_name: faker.commerce.productName(),
                price: parseInt(faker.commerce.price({ min: 5000, max: 100000, dec: 0 })),
                quantity: faker.number.int({ min: 1, max: 3 }),
            });
        }
        await Cart.insertMany(cartsData);
        console.log(`${cartsData.length} cart items created.`);

        // reviewsData ============================================================================================================
        const reviewsData = [];
        for (let i = 0; i < 40; i++) { // Buat 40 review acak
            const randomRecipe = faker.helpers.arrayElement(createdRecipes);
            const randomUser = faker.helpers.arrayElement(createdUsers);
            reviewsData.push({
                recipeId: randomRecipe._id,
                recipeTitle: randomRecipe.title,
                commentedBy: randomUser._id,
                commentedByUsername: randomUser.username,
                comment: faker.lorem.sentence(),
                rating: faker.number.int({ min: 1, max: 5 }),
            });
        }
        await Review.insertMany(reviewsData);
        console.log(`${reviewsData.length} reviews created.`);

        // transactionsData & detailTrans ============================================================================================================
        const transactionsData = [];
        for (let i = 0; i < NUM_TRANSACTIONS; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers);
            transactionsData.push({
                date: faker.date.past(),
                user_id: randomUser._id,
                type: faker.helpers.arrayElement(['item', 'premium']),
                total_amount: parseInt(faker.commerce.price({ min: 25000, max: 250000, dec: 0 })),
            });
        }
        const createdTransactions = await Transaction.insertMany(transactionsData);
        console.log(`${createdTransactions.length} transactions created.`);

        const detailTransData = [];
        for (const trans of createdTransactions) {
            if (trans.type === 'item') {
                for (let i = 0; i < faker.number.int({ min: 1, max: 4 }); i++) {
                    detailTransData.push({
                        transaction_id: trans._id,
                        item_name: faker.commerce.productName(),
                        quantity: faker.number.int({ min: 1, max: 3 }),
                        price: parseInt(faker.commerce.price({ min: 10000, max: 50000, dec: 0 })),
                    });
                }
            }
        }
        await DetailTrans.insertMany(detailTransData);
        console.log(`${detailTransData.length} transaction details created.`);
        
        // aiQueriesData ============================================================================================================
        const aiQueriesData = [];
        for(let i = 0; i < 30; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers);
            aiQueriesData.push({
                userId: randomUser._id,
                prompt: faker.lorem.sentence({ min: 5, max: 10 }),
                response: faker.lorem.paragraph(),
            });
        }
        await AiQueries.insertMany(aiQueriesData);
        console.log(`${aiQueriesData.length} AI queries created.`);

        // subscriptionsData ============================================================================================================
        const subscriptionsData = [];
        for (const user of createdUsers) {
            const startDate = faker.date.past();
            subscriptionsData.push({
                userId: user._id,
                startDate: startDate,
                endDate: faker.date.future({ refDate: startDate }),
                paymentStatus: faker.helpers.arrayElement(['pending', 'completed', 'cancelled']),
                status: faker.helpers.arrayElement(['active', 'expired', 'cancelled']),
            });
        }
        await Subscriptions.insertMany(subscriptionsData);
        console.log(`${subscriptionsData.length} subscriptions created.`);

        // failedLoginAttemptsData & ipBansData ============================================================================================================
        const ipBansData = [];
        for (let i = 0; i < 5; i++) {
            ipBansData.push({ ipAddress: faker.internet.ipv4(), isBanned: true, timeoutHistory: [faker.date.recent()], reason: "Aktivitas mencurigakan terdeteksi dari seeder."});
        }
        await IpBan.insertMany(ipBansData);
        console.log(`${ipBansData.length} IP bans created.`);

        const failedLoginAttemptsData = [];
        for (let i = 0; i < 10; i++) {
            failedLoginAttemptsData.push({ identifier: faker.internet.email(), ipAddress: faker.internet.ipv4(), timestamps: [faker.date.recent(), faker.date.recent()], lockUntil: i % 4 === 0 ? faker.date.future() : null });
        }
        await FailedLoginAttempt.insertMany(failedLoginAttemptsData);
        console.log(`${failedLoginAttemptsData.length} failed login attempts created.`);
        
        // log ============================================================================================================
        const logsData = [];
        const logActions = ["REGISTER", "LOGIN_BERHASIL", "LOGOUT", "GANTI_PASSWORD", "REFRESH_TOKEN", "UPDATE_ROLE"];
        for (let i = 0; i < 100; i++) {
            const randomUser = faker.helpers.arrayElement(createdUsers);
            logsData.push({
                userId: randomUser._id,
                action: faker.helpers.arrayElement(logActions),
                status: faker.helpers.arrayElement(['BERHASIL', 'GAGAL']),
                ipAddress: faker.internet.ip(),
                details: 'Action performed via seeder.',
            });
        }
        await Log.insertMany(logsData);
        console.log(`${logsData.length} logs created.`);


        console.log('\n✅ All Data Seeded Successfully!');

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

const run = async () => {
    await connectDB();
    const args = process.argv.slice(2);
    if (args.includes('--import')) {
        await importData();
    } else if (args.includes('--destroy')) {
        await destroyData();
    } else {
        console.log('Please provide a valid argument:\n  --import   : to seed dummy data\n  --destroy  : to destroy all data');
    }
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
};

run();