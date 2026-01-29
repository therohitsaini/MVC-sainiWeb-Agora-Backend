const express = require("express");
const { adminController, voucherController, getVouchersController, getTransactionController, getUserConsultantController, getShopAllUserController, getShopAllConsultantController, updateUserConsultantController, appEnableAndDisableController, getAppStatusController, checkAppBillingController } = require("../Controller/adminController");
const { verifyShopifyToken } = require("../MiddleWare/ShopifyMiddleware/verifyShopifyToken");

const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);
adminRoute.post("/admin/voucher/:adminId", voucherController);
adminRoute.get("/get/vouchers/:adminId", getVouchersController);
adminRoute.get("/activity/transactions/:adminId", verifyShopifyToken, getTransactionController);
adminRoute.get("/user/consultant/:adminId", verifyShopifyToken, getUserConsultantController);
adminRoute.get("/shop/all-user/:adminId", verifyShopifyToken, getShopAllUserController);
adminRoute.get("/shop/all-consultant/:adminId", verifyShopifyToken, getShopAllConsultantController);
adminRoute.post("/update-wallet/:adminId", updateUserConsultantController);
adminRoute.post("/app-enable-and-disable/:adminId", verifyShopifyToken, appEnableAndDisableController);
adminRoute.get("/app-status", getAppStatusController);
adminRoute.get("/shop/billing-status/:adminId", checkAppBillingController)
module.exports = { adminRoute };    