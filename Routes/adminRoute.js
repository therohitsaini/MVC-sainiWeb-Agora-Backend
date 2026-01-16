const express = require("express");
const { adminController, voucherController, getVouchersController, getTransactionController, getUserConsultantController } = require("../Controller/adminController");
const { verifyShopifyToken } = require("../MiddleWare/ShopifyMiddleware/verifyShopifyToken");

const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);
adminRoute.post("/admin/voucher/:adminId", voucherController);
adminRoute.get("/get/vouchers/:adminId", getVouchersController);
adminRoute.get("/activity/transactions/:adminId", getTransactionController);
adminRoute.get("/user/consultant/:adminId", verifyShopifyToken, getUserConsultantController);
module.exports = { adminRoute };    