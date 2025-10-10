const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        type: {
            type: String,
            enum: ["text", "image", "file"],
            default: "text"
        },
        content: {
            type: String,
            trim: true,
            default: ""
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent"
        },
        readAt: { type: Date }
    },
    { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", MessageSchema);

module.exports = { Message };


