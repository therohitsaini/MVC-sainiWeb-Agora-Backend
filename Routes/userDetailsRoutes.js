const express = require("express");
const userDetailsRouter = express.Router();
const { getAllUsers, getUserById, getShopifyUserByCustomerId, getAppStatusController } = require("../Controller/userDetailsController");
const { tokenVerify, authenticateToken } = require("../Auth/signup-signin");

// Token verification endpoint
userDetailsRouter.get("/token", tokenVerify);

// Protected routes - require authentication
userDetailsRouter.get("/user-details",  getAllUsers);
userDetailsRouter.get("/:id", authenticateToken, getUserById);
userDetailsRouter.get("/shopify-user/:customerId", getShopifyUserByCustomerId);
userDetailsRouter.get("/app-status", getAppStatusController);


module.exports = { userDetailsRouter };
