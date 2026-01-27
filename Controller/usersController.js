const { User } = require("../Modal/userSchema");

const usersController = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user",

        });
    }
}

const checkedUserBlance = async (req, res) => {
    try {
        const { userId, consultantId } = req.params;
        const { callType = "voice" } = req.query;
        console.log("callType", callType);
        const user = await User.findById(userId).select("-password");
        const consultant = await User.findById(consultantId).select(" voiceCallCost").lean();
        console.log("consultant", consultant)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        console.log("user.walletBalance", user.walletBalance)
        let callCost = callType === "voice" ? consultant.voiceCallCost : consultant.videoCallCost;
        if (user.walletBalance < callCost) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance"
            });
        }
        return res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: {
                userBalance: user.walletBalance,
                consultantBalance: callCost,
                callCost,
                callType
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user",
            error: error.message
        });
    }
}
module.exports = { usersController, checkedUserBlance };