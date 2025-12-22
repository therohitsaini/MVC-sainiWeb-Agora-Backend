const express = require("express");
const { adminController, voucherController } = require("../Controller/adminController");
const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);
adminRoute.post("/admin/voucher/:adminId", voucherController);
module.exports = { adminRoute };    