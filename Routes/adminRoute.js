const express = require("express");
const { adminController, voucherController, getTransactionController, getUserConsultantController, getShopAllUserController, getShopAllConsultantController, updateUserConsultantController, appEnableAndDisableController, getAppStatusController, checkAppBillingController, voucherHandlerController, updatesVoucherController } = require("../Controller/adminController");
const { verifyShopifyToken } = require("../MiddleWare/ShopifyMiddleware/verifyShopifyToken");

const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);
adminRoute.post("/admin/voucher/:adminId", voucherController);
adminRoute.get("/activity/transactions/:adminId", verifyShopifyToken, getTransactionController);
adminRoute.get("/user/consultant/:adminId", verifyShopifyToken, getUserConsultantController);
adminRoute.get("/shop/all-user/:adminId", verifyShopifyToken, getShopAllUserController);
adminRoute.get("/shop/all-consultant/:adminId", verifyShopifyToken, getShopAllConsultantController);
adminRoute.post("/update-wallet/:adminId", verifyShopifyToken, updateUserConsultantController);
adminRoute.post("/app-enable-and-disable/:adminId", verifyShopifyToken, appEnableAndDisableController);
adminRoute.get("/app-status", verifyShopifyToken, getAppStatusController);
adminRoute.get("/shop/billing-status/:adminId", verifyShopifyToken, checkAppBillingController)
adminRoute.delete("/delete/voucher/:shopId/:voucherId", verifyShopifyToken, voucherHandlerController)
adminRoute.put("/admin/voucher-updates/:shopId/:voucherId", verifyShopifyToken, updatesVoucherController)
module.exports = { adminRoute };    