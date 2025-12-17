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
    debitFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    creditTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    adminAmount: {
        type: Number,
        default: 0
    },
    consultantAmount: {
        type: Number,
        default: 0
    },
    startTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ["active", "ended"],
        default: "active"
    },
    type: {
        type: String,
        enum: ["chat", "voice-call", "video-call"],
        required: true
    }
}, { timestamps: true });

const TransactionHistroy = mongoose.model("Transaction", transactionSchema);

module.exports = { TransactionHistroy };