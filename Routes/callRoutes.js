const express = require("express");
const callRouter = express.Router();
const {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    getCallHistory,
    getPendingCalls
} = require("../Controller/callController");

// POST /api/calls/initiate - Initiate a new call
callRouter.post("/initiate", initiateCall);

// PUT /api/calls/:callId/accept - Accept a call
callRouter.put("/:callId/accept", acceptCall);

// PUT /api/calls/:callId/reject - Reject a call
callRouter.put("/:callId/reject", rejectCall);

// PUT /api/calls/:callId/end - End a call
callRouter.put("/:callId/end", endCall);

// GET /api/calls/history/:userId - Get call history for a user
callRouter.get("/history/:userId", getCallHistory);

// GET /api/calls/pending/:userId - Get pending calls for a user
callRouter.get("/pending/:userId", getPendingCalls);

module.exports = { callRouter };


