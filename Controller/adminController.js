const { shopModel } = require("../Modal/shopify");
const mongoose = require("mongoose");
const { TransactionHistroy } = require("../Modal/transactionHistroy");
const { User } = require("../Modal/userSchema");
const { WalletHistory } = require("../Modal/walletHistory");
const { WithdrawalRequestSchema } = require("../Modal/withdrawalSchema");

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
        const type = Number(req.query.type) || 0;
        console.log("type", type);
        const typeMap = {
            0: "all",
            1: "chat",
            2: "voice",
            3: "video"
        };

        const typeValue = typeMap[type] || "all";
        console.log("typeValue", typeValue);

        const filter = { shop_id: adminId };

        if (typeValue !== "all") {
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
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        console.log("search??????????????????", search);
        console.log("page", page);
        console.log("limit", limit);
        const skip = (page - 1) * limit;
        console.log("skip", skip);
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }

        const customers = await WalletHistory.find({
            shop_id: adminId,
        })
            .sort({ createdAt: -1 })
            .populate({
                path: "userId",
                select: "fullname email profileImage phone userType",
                match: search
                    ? { fullname: { $regex: search, $options: "i" } }
                    : {},
            })
            .skip(skip)
            .limit(limit)
            .lean();
        const filteredData = customers.filter(item => item.userId !== null && item.userId.fullname.toLowerCase().includes(search.toLowerCase()));
        const totalItems = await WalletHistory.countDocuments({ shop_id: adminId });
        if (!customers || customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customers not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Customers retrieved successfully ?",
            data: filteredData,
            totalItems,
            page,
            limit,
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
const updateUserConsultantController = async (req, res) => {
    try {
        const { adminId } = req.params;
        const body = req.body;
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }
        const user = await User.findById(body.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const mType = body.mainType === "manual_credit" ? "credit" : "debit";
        const uAmount = +body.amount;
        console.log("uAmount", uAmount);
        user.walletBalance = mType === "credit" ? user.walletBalance + uAmount : user.walletBalance - uAmount;
        await user.save();
        await WalletHistory.create({
            userId: body.userId,
            shop_id: adminId,
            amount: uAmount,
            referenceType: "manual",
            description: body.description,
            transactionType: body.mainType,
            direction: mType,
            status: "success",
        });
        res.status(200).json({
            success: true,
            message: "User wallet updated successfully",
            data: user,
        });

    } catch (error) {
        console.error("Error in updateUserConsultantController:", error);
    }
}


// app enable and disable
const appEnableAndDisableController = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { appStatus } = req.body;


        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }

        const admin = await shopModel.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        admin.appEnabled = appStatus;
        await admin.save();

        return res.status(200).json({
            success: true,
            message: `App ${appStatus ? "enabled" : "disabled"} successfully`,
            appEnabled: admin.appEnabled,
        });

    } catch (error) {
        console.error("Error in appEnableAndDisableController:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to enable or disable app",
        });
    }
};



const checkAppBillingController = async (req, res) => {
    try {
        const { adminId } = req.params
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }
        const shop = await shopModel.findById(adminId).select("-accessToken")
        if (!shop) return
        return res.status(200).json({
            success: true,
            message: "App status retrieved successfully",
            data: shop,
        });

    } catch (error) {
        console.error("Error in appEnableAndDisableController:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to enable or disable app",
        });
    }
}


const voucherHandlerController = async (req, res) => {
    try {
        const { shopId, voucherId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(shopId) ||
            !mongoose.Types.ObjectId.isValid(voucherId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID",
            });
        }

        const shop = await shopModel.findById(shopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: "Shop not found" });
        }

        shop.vouchers = shop.vouchers.filter(
            (v) => v._id.toString() !== voucherId
        );

        await shop.save();

        return res.status(200).json({
            success: true,
            message: "Voucher deleted successfully",
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const updatesVoucherController = async (req, res) => {
    try {
        const { shopId, voucherId } = req.params;
        const { totalCoin, extraCoin } = req.body;

        if (
            !mongoose.Types.ObjectId.isValid(shopId) ||
            !mongoose.Types.ObjectId.isValid(voucherId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID",
            });
        }

        const shop = await shopModel.findById(shopId);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: "Shop not found",
            });
        }

        const voucher = shop.vouchers.id(voucherId);

        if (!voucher) {
            return res.status(404).json({
                success: false,
                message: "Voucher not found",
            });
        }

        if (totalCoin !== undefined) voucher.totalCoin = totalCoin;
        if (extraCoin !== undefined) voucher.extraCoin = extraCoin;

        await shop.save();

        return res.status(200).json({
            success: true,
            message: "Voucher updated successfully",
            voucher,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const getWithdrawalRequest = async (req, res) => {
    try {
        const { adminId } = req.params
        console.log("adminId", adminId)
        const page = Number(req.query.page) || 3;
        const limit = Number(req.query.limit) || 14;
        const skip = (page - 1) * limit;
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }
        const widthrawal = await WithdrawalRequestSchema.find({
            shopId: adminId
        }).populate("consultantId", "fullname email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();;

        if (!widthrawal) return
        const totalItems = await WithdrawalRequestSchema.countDocuments({ shopId: adminId });

        return res.status(200).json({
            success: true,
            message: "App status retrieved successfully",
            data: widthrawal,
            totalItems
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        })
    }
}


const updateConsultantWidthrawalRequest = async (req, res) => {
    try {
        const { adminId } = req.params;
        const body = req.body;
        console.log("body", req.body)
        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }
        const user = await User.findById(body.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const updateReq = await WithdrawalRequestSchema.findByIdAndUpdate(body.transactionId, {
            status: "paid",
            transactionNumber: body.transactionNumber,
            description: body.description,
        })

        console.log("updateReq", updateReq)

        await WalletHistory.create({
            userId: body.userId,
            shop_id: adminId,
            amount: body.amount,
            referenceType: "withdraw",
            description: body.description,
            transactionType: "withdraw",
            direction: body.mainType === "paid" ? "credit" : "",
            status: "success",
        });

        res.status(200).json({
            success: true,
            message: "Paymet successfully",
            data: user,

        });

    } catch (error) {
        console.error("Error in updateUserConsultantController:", error);
    }
}


const declineWithdrawalRequest = async (req, res) => {
    try {
        const { transactionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(transactionId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID",
            });
        }

        const withdrawal = await WithdrawalRequestSchema.findById(transactionId);
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: "Withdrawal request not found",
            });
        }

        if (withdrawal.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Withdrawal already processed",
            });
        }
        if (withdrawal.status == "paid" || withdrawal.status == "declined") {
            return res.status(400).json({
                success: false,
                message: "Alredy Updated ? ",
            });
        }

        const user = await User.findById(withdrawal.consultantId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Consultant not found",
            });
        }

        user.walletBalance += withdrawal.amount;
        await user.save();

        withdrawal.status = "declined";
        await withdrawal.save();

        return res.status(200).json({
            success: true,
            message: "Withdrawal request declined and amount refunded",
        });

    } catch (error) {
        console.error("Decline withdrawal error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

const updateAdminPercentage = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { adminPercentage } = req.body;
        console.log("__________", adminId, adminPercentage)

        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid admin ID",
            });
        }

        if (adminPercentage === undefined || adminPercentage < 0 || adminPercentage > 100) {
            return res.status(400).json({
                success: false,
                message: "Admin percentage must be between 0 and 100",
            });
        }

        const updatedShop = await shopModel.findByIdAndUpdate(
            adminId,
            {
                adminPersenTage: adminPercentage
            },
            { new: true }
        );

        if (!updatedShop) {
            return res.status(404).json({
                success: false,
                message: "Admin / Shop not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin percentage updated successfully",
            data: updatedShop,
        });

    } catch (error) {
        console.error("Update admin percentage error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};



module.exports = {
    adminController,
    voucherController,
    deleteAdminController,
    getTransactionController,
    getUserConsultantController,
    getShopAllUserController,
    getShopAllConsultantController,
    updateUserConsultantController,
    appEnableAndDisableController,
    checkAppBillingController,
    voucherHandlerController,
    updatesVoucherController,
    getWithdrawalRequest,
    updateConsultantWidthrawalRequest,
    declineWithdrawalRequest,
    updateAdminPercentage
};