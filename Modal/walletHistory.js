const walletHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ragisterUser",
        required: true
    },

    shop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "shopModel",
        required: true
    },

    amount: {
        type: Number,
        required: true
    },

    balanceBefore: {
        type: Number,
        required: true
    },

    balanceAfter: {
        type: Number,
        required: true
    },

    transactionType: {
        type: String,
        enum: [
            "recharge",
            "bonus",
            "usage",          // call/chat/video cut
            "manual_credit",
            "manual_debit",
            "withdraw",
            "refund"
        ],
        required: true
    },

    referenceType: {
        type: String,
        enum: ["call", "chat", "video", "recharge", "manual", "withdraw"],
        default: null
    },

    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null 
    },

    direction: {
        type: String,
        enum: ["credit", "debit"],
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ragisterUser", // admin id
        default: null
    },

    status: {
        type: String,
        enum: ["success", "pending", "failed"],
        default: "success"
    }
}, { timestamps: true });

module.exports = mongoose.model("WalletHistory", walletHistorySchema);
