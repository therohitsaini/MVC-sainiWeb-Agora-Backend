const express = require("express");
const videoCallRouter = express.Router();
const { generateToken } = require("../Controller/videoCallController");

videoCallRouter.post("/generate-token", generateToken);

module.exports = videoCallRouter;