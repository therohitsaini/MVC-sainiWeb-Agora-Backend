const express = require("express")
const { pricingCallback } = require("../Controller/adminPrincingController")
const adminPrincingRoute = express.Router()


adminPrincingRoute.get("/admin/princing-callback", pricingCallback)

module.exports = { adminPrincingRoute }