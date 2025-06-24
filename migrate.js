const mongoose = require('mongoose');
require('dotenv').config();

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

const allModels = [
    User,
    Recipe,
    Review,
    Transaction,
    DetailTrans,
    Cart,
    AiQueries,
    Subscriptions,
    Log,
    FailedLoginAttempt,
    IpBan
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for migration...');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

const runMigration = async () => {
    try {
        console.log('Starting index synchronization for all models...');

        for (const model of allModels) {
            const modelName = model.modelName;
            console.log(`- Synchronizing indexes for: ${modelName}`);
            await model.syncIndexes();
        }

        console.log('\n✅ All indexes have been synchronized successfully!');
    } catch (error) {
        console.error('\n❌ An error occurred during index synchronization:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

const execute = async () => {
    await connectDB();
    await runMigration();
};

execute();