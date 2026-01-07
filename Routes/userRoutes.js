const express = require("express");
const userRouter = express.Router();
const { usersController, checkedUserBlance } = require("../Controller/usersController");

userRouter.get("/shopify/users/:userId", usersController);
userRouter.get("/shopify/users/checked-balance/:userId/:consultantId", checkedUserBlance);
module.exports = { userRouter };