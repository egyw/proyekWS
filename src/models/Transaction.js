const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['item', 'premium'],
        default: null
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);