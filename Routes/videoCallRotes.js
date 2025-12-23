const express = require("express");
const callRoutes = express.Router();
const { generateToken, generateVoiceToken } = require("../Controller/videoCallController");
const { authenticateToken } = require("../Auth/signup-signin");

// Protected routes - require authentication
callRoutes.post("/generate-token", generateToken);
callRoutes.post("/generate-voice-token", generateVoiceToken);

module.exports = callRoutes;