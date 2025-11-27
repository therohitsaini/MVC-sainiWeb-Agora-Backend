const mongoose = require("mongoose");

const ChatListSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ragisterUser",
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ragisterUser",
            required: true
        },
        shop_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "shopifyShop",
            required: true
        },
        lastMessage: {
            type: String
        }
    },
    { timestamps: true }
);

const ChatList = mongoose.models.chatlist || mongoose.model("chatlist", ChatListSchema);

module.exports = { ChatList };
