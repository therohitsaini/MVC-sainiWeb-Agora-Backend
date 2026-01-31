const express = require("express");
const userRouter = express.Router();
const { usersController, checkedUserBlance } = require("../Controller/usersController");
const { getVouchersController } = require("../Controller/userDetailsController");

userRouter.get("/shopify/users/:userId", usersController);
userRouter.get("/shopify/users/checked-balance/:userId/:consultantId", checkedUserBlance);
userRouter.get("/get/vouchers/:adminId", getVouchersController)
module.exports = { userRouter };