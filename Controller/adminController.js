const { shopModel } = require("../Modal/shopify");
const mongoose = require("mongoose");

const adminController = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: "Admin ID is required"
            });
        }
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID"
            });
        }
        const admin = await shopModel.findOne({ _id: adminId }).select("-accessToken");
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Admin retrieved successfully",
            data: admin
        });
    } catch (error) {
        console.error("Error in adminController:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin data",
            error: error.message
        });
    }
}

module.exports = { adminController };