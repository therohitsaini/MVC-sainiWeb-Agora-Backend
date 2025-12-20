const express = require("express");
const { adminController } = require("../Controller/adminController");
const adminRoute = express.Router();


adminRoute.get("/admin/:adminId", adminController);

module.exports = { adminRoute };    