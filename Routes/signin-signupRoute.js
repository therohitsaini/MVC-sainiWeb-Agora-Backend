const express = require("express");
const signinSignupRouter = express.Router();
const { signUp, signIn } = require("../Auth/signup-signin");

signinSignupRouter.post("/signup", signUp);
signinSignupRouter.post("/signin", signIn);

module.exports = {signinSignupRouter};   