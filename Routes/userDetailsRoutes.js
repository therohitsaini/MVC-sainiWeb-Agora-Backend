const express = require("express");
const userDetailsRouter = express.Router();
const { getAllUsers, getUserById } = require("../Controller/userDetailsController");
const { tokenVerify, authenticateToken } = require("../Auth/signup-signin");

// Token verification endpoint
userDetailsRouter.get("/token", tokenVerify);

// Protected routes - require authentication
userDetailsRouter.get("/user-details", authenticateToken, getAllUsers);
userDetailsRouter.get("/:id", authenticateToken, getUserById);

module.exports = { userDetailsRouter };
