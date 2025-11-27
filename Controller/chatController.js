const mongoose = require("mongoose");
const { MessageModal } = require("../Modal/messageSchema");

const getChatHistory = async (request, response) => {
    try {
        const { shopId, consultantId, userId } = request.params;
        console.log("GET CHAT HISTORY", request.params);
        if (!mongoose.Types.ObjectId.isValid(shopId)) {
            return response.status(400).json({ message: 'Invalid shop ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(consultantId)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return response.status(400).json({ message: 'Invalid user ID' });
        }
        if (!shopId || !consultantId || !userId) {
            return response.status(400).json({ message: 'Shop ID, consultant ID and user ID are required' });
        }
        const chatHistory = await MessageModal.find({ shop_id: shopId, receiverId: consultantId, senderId: userId });
        if (!chatHistory) {
            return response.status(400).json({ message: 'Chat history not found' });
        }
        console.log("CHAT HISTORY", chatHistory);
        return response.status(200).send({ success: true, message: 'Chat history fetched successfully',chatHistory });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getChatHistory
}   