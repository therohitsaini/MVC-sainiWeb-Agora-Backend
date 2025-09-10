const express = require("express");
const videoCallRouter = express.Router();
const { generateToken, generateVoiceToken } = require("../Controller/videoCallController");

videoCallRouter.post("/generate-token", generateToken);
videoCallRouter.post("/generate-voice-token", generateVoiceToken);

module.exports = videoCallRouter;