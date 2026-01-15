const express = require("express");
const { adminController, voucherController, getVouchersController, getTransactionController } = require("../Controller/adminController");
const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);
adminRoute.post("/admin/voucher/:adminId", voucherController);
adminRoute.get("/get/vouchers/:adminId", getVouchersController);
adminRoute.get("/activity/transactions/:adminId", getTransactionController);
module.exports = { adminRoute };    