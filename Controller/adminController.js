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

const voucherController = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { totalCoin, extraCoin, voucherCode } = req.body;
        console.log(totalCoin, extraCoin, voucherCode);

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
        const voucher = {
            voucherCode: voucherCode || "",
            totalCoin: totalCoin,
            extraCoin: extraCoin,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        admin.vouchers.push(voucher);
        await admin.save();
        res.status(200).json({
            success: true,
            message: "Voucher created successfully",
            data: admin
        });

    } catch (error) {
        console.error("Error in voucherController:", error);
    }
}


const getVouchersController = async (req, res) => {
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
        const admin = await shopModel.findOne({ _id: adminId }).select("-accessToken").select("vouchers").select("_id");
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        const vouchers = {
            voucherCode: admin.vouchers,
            id: admin._id

        }
        res.status(200).json({
            success: true,
            message: "Vouchers retrieved successfully",
            data: vouchers
        });
    } catch (error) {
        console.error("Error in getVouchersController:", error);
    }
}

const deleteAdminController = async (req, res) => {
    try {
        const shop = req.headers["x-shopify-shop-domain"];

        const admin = await shopModel.findOneAndUpdate(
            { shop },
            {
                accessToken: null,
                uninstalledAt: new Date(),
            }
        );
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleteAdminController:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete admin",
            error: error.message
        });
    }
}

module.exports = { adminController, voucherController, getVouchersController, deleteAdminController };