const express = require("express");
const { getChatHistory } = require("../Controller/chatController");
const chatRoutes = express.Router();

chatRoutes.get("/get/chat-history/:shopId/:userId/:consultantId", getChatHistory);

module.exports = chatRoutes;