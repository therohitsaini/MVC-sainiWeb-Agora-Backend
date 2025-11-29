const mongoose = require("mongoose");
const { MessageModal } = require("../Modal/messageSchema");

const getChatHistory = async (request, response) => {
    try {
        const { shopId, consultantId, userId } = request.params;

        console.log("GET CHAT HISTORY", request.params);

        if (!mongoose.Types.ObjectId.isValid(shopId) ||
            !mongoose.Types.ObjectId.isValid(consultantId) ||
            !mongoose.Types.ObjectId.isValid(userId)) {
            return response.status(400).json({ message: "Invalid IDs" });
        }

        const chatHistory = await MessageModal.find({
            shop_id: shopId,
            $or: [
                { senderId: userId, receiverId: consultantId },        // user → consultant
                { senderId: consultantId, receiverId: userId }         // consultant → user
            ]
        }).sort({ timestamp: 1 });  // sorting by time

        if (!chatHistory) {
            return response.status(400).json({ message: "Chat history not found" });
        }

        return response.status(200).json({
            success: true,
            message: "Chat history fetched successfully",
            chatHistory
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Server error" });
    }
};


module.exports = {
    getChatHistory
}   