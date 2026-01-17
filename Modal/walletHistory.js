const mongoose = require("mongoose");

const walletHistorySchema = new mongoose.Schema(
    {
        shop_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "shopModel",
        },

        transactionType: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        balanceBefore: {
            type: Number,
            required: true,
        },

        balanceAfter: {
            type: Number,
            required: true,
        },

        reason: {
            type: String,
            enum: [
                "recharge",
                "chat",
                "voice_call",
                "video_call",
                "refund",
                "admin_adjustment",
                "withdrawal",
            ],
            required: true,
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null, // transactionId / callId / orderId
        },

        status: {
            type: String,
            enum: ["success", "pending", "failed"],
            default: "success",
        },

        performedBy: {
            type: String,
            enum: ["system", "admin", "user"],
            default: "system",
        },

        description: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("WalletHistory", walletHistorySchema);
