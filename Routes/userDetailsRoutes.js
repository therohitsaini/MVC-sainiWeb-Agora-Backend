const express = require("express");
const userDetailsRouter = express.Router();
const { getAllUsers, getUserById, getShopifyUserByCustomerId, getAppStatusController, getUserWalletHistroy, getcallSessionsController } = require("../Controller/userDetailsController");
const { tokenVerify, authenticateToken } = require("../Auth/signup-signin");

// Token verification endpoint
userDetailsRouter.get("/token", tokenVerify);

// Protected routes - require authentication
userDetailsRouter.get("/user-details", getAllUsers);
userDetailsRouter.get("d/:id", getUserById);
userDetailsRouter.get("/shopify-user/:customerId", getShopifyUserByCustomerId);
userDetailsRouter.get("/app-status-verify-app-status", getAppStatusController);
userDetailsRouter.get("/get/wallet-history/:userId/:shopId", getUserWalletHistroy)
userDetailsRouter.use("/find-call-session", getcallSessionsController);


module.exports = { userDetailsRouter };
