const express = require("express");
const userDetailsRouter = express.Router();
const { getAllUsers, getUserById } = require("../Controller/userDetailsController");

// GET all users
userDetailsRouter.get("/user-details", getAllUsers);

// GET user by ID
userDetailsRouter.get("/:id", getUserById);


module.exports = { userDetailsRouter };
