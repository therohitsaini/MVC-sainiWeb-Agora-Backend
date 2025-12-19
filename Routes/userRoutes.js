const express = require("express");
const userRouter = express.Router();
const { usersController } = require("../Controller/usersController");

userRouter.get("/shopify/users/:userId", usersController);

module.exports = { userRouter };