const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Transaction', TransactionSchema, 'transactions');