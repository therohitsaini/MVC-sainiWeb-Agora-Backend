const express = require("express");
const videoCallRouter = express.Router();
const { generateToken, generateVoiceToken } = require("../Controller/videoCallController");
const { authenticateToken } = require("../Auth/signup-signin");

// Protected routes - require authentication
videoCallRouter.post("/generate-token", authenticateToken, generateToken);
videoCallRouter.post("/generate-voice-token", authenticateToken, generateVoiceToken);

module.exports = videoCallRouter;