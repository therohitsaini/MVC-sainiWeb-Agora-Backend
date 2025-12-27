const express = require("express");
const callRoutes = express.Router();
const { generateToken, generateVoiceToken, getCaller_Receiver_Details } = require("../Controller/videoCallController");
const { authenticateToken } = require("../Auth/signup-signin");

// Protected routes - require authentication
callRoutes.post("/generate-token", generateToken);
callRoutes.post("/generate-voice-token", generateVoiceToken);
callRoutes.get("/get-caller-receiver-details", getCaller_Receiver_Details);

module.exports = { callRoutes };