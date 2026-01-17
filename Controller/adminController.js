const { shopModel } = require("../Modal/shopify");
const mongoose = require("mongoose");
const { TransactionHistroy } = require("../Modal/transactionHistroy");
const { User } = require("../Modal/userSchema");

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

const getTransactionController = async (req, res) => {
    try {
        const { adminId } = req.params;

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID is required',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid admin ID',
            });
        }

        const page = Number(req.query.page) || 3;
        const limit = Number(req.query.limit) || 14;
        const skip = (page - 1) * limit;
        const type = req.query.type || "";
        const typeValue = type === 0 ? 'all' : type === 1 ? 'chat' : type === 2 ? 'voice' : type === 3 ? 'video' : 'all';
        const filter = { shop_id: adminId };
        if (typeValue && typeValue !== 'all') {
            filter.type = typeValue;
        }

        const transactions = await TransactionHistroy.find(filter)
            .populate('senderId', 'fullname email profileImage userType')
            .populate('receiverId', 'fullname email profileImage userType')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalItems = await TransactionHistroy.countDocuments(filter);

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No transactions found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Transactions retrieved successfully',
            data: transactions,
            totalItems,
            page,
            limit,
        });
    } catch (error) {
        console.error('Error in getTransactionController:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};
const getUserConsultantController = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }

        const customers = await User.find({
            shop_id: adminId,
        })
            .select("fullname email profileImage userType walletBalance updatedAt phone").limit(10)
            .lean();

        if (!customers || customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customers not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Customers retrieved successfully",
            data: customers,
        });

    } catch (error) {
        console.error("Error in getUserConsultantController:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get customers",
        });
    }
};

const getShopAllUserController = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }
        const users = await User.find({
            shop_id: adminId, userType: "customer",
        })
            .select("fullname email profileImage userType walletBalance updatedAt phone")
            .lean();

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Users not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
        });
    } catch (error) {
        console.error("Error in getShopAllUserController:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get users",
        });
    }
}

const getShopAllConsultantController = async (req, res) => {
    try {
        const { adminId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }
        const users = await User.find({
            shop_id: adminId, userType: "consultant",
        })
            .select("fullname email profileImage userType walletBalance updatedAt phone")
            .lean();

        if (!users || users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Consultants not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: users,
        });
    } catch (error) {
        console.error("Error in getShopAllUserController:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get users",
        });
    }
}
module.exports = {
    adminController,
    voucherController,
    getVouchersController,
    deleteAdminController,
    getTransactionController,
    getUserConsultantController,
    getShopAllUserController,
    getShopAllConsultantController
};