const express = require("express");
const { adminController, voucherController, getVouchersController } = require("../Controller/adminController");
const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);
adminRoute.post("/admin/voucher/:adminId", voucherController);
adminRoute.get("/get/vouchers/:adminId", getVouchersController);
module.exports = { adminRoute };    