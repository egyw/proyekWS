const mongoose = require('mongoose');

const DetailTransSchema = new mongoose.Schema({
    transaction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },
    item_name: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Detail_trans', DetailTransSchema, 'detail_trans');