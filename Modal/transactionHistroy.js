const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shopModel",
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ["chat", "voice-call", "video-call"],
        required: true
    }
}, { timestamps: true });

const TransactionHistroy = mongoose.model("Transaction", transactionSchema);

module.exports = { TransactionHistroy };