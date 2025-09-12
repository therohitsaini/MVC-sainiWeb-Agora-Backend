const Call = require("../Modal/callSchema");
const User = require("../Modal/userSchema");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

// Initiate a call
const initiateCall = async (req, res) => {
    try {
        const { callerId, receiverId, callType } = req.body;

        // Validate required fields
        if (!callerId || !receiverId || !callType) {
            return res.status(400).json({
                success: false,
                message: "callerId, receiverId, and callType are required"
            });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        // Generate unique channel name
        const channelName = `call_${callerId}_${receiverId}_${Date.now()}`;

        // Generate Agora token
        const token = RtcTokenBuilder.buildTokenWithUid(
            process.env.AGORA_APP_ID,
            process.env.AGORA_APP_CERTIFICATE,
            channelName,
            callerId,
            RtcRole.PUBLISHER,
            3600 // 1 hour expiry
        );

        // Create call record
        const call = new Call({
            callerId,
            receiverId,
            callType,
            channelName,
            token,
            status: 'pending'
        });

        await call.save();

        // TODO: Add WebSocket notification here
        console.log('Call initiated - WebSocket notification will be added later');

        // Return call details for notification
        res.status(201).json({
            success: true,
            message: "Call initiated successfully",
            data: {
                callId: call._id,
                callerId,
                receiverId,
                callType,
                channelName,
                token,
                receiverName: receiver.fullname,
                receiverEmail: receiver.email
            }
        });

    } catch (error) {
        console.error("Error initiating call:", error);
        res.status(500).json({
            success: false,
            message: "Failed to initiate call",
            error: error.message
        });
    }
};

// Accept a call
const acceptCall = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findById(callId);
        if (!call) {
            return res.status(404).json({
                success: false,
                message: "Call not found"
            });
        }

        if (call.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Call is no longer pending"
            });
        }

        // Update call status
        call.status = 'accepted';
        await call.save();

        // TODO: Add WebSocket notification here
        console.log('Call accepted - WebSocket notification will be added later');

        res.status(200).json({
            success: true,
            message: "Call accepted",
            data: {
                callId: call._id,
                channelName: call.channelName,
                token: call.token,
                callType: call.callType
            }
        });

    } catch (error) {
        console.error("Error accepting call:", error);
        res.status(500).json({
            success: false,
            message: "Failed to accept call",
            error: error.message
        });
    }
};

// Reject a call
const rejectCall = async (req, res) => {
    try {
        const { callId } = req.params;

        const call = await Call.findById(callId);
        if (!call) {
            return res.status(404).json({
                success: false,
                message: "Call not found"
            });
        }

        if (call.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Call is no longer pending"
            });
        }

        // Update call status
        call.status = 'rejected';
        call.endTime = new Date();
        await call.save();

        // TODO: Add WebSocket notification here
        console.log('Call rejected - WebSocket notification will be added later');

        res.status(200).json({
            success: true,
            message: "Call rejected"
        });

    } catch (error) {
        console.error("Error rejecting call:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reject call",
            error: error.message
        });
    }
};

// End a call
const endCall = async (req, res) => {
    try {
        const { callId } = req.params;
        const { duration } = req.body;

        const call = await Call.findById(callId);
        if (!call) {
            return res.status(404).json({
                success: false,
                message: "Call not found"
            });
        }

        // Update call status
        call.status = 'ended';
        call.endTime = new Date();
        call.duration = duration || 0;
        await call.save();

        res.status(200).json({
            success: true,
            message: "Call ended successfully"
        });

    } catch (error) {
        console.error("Error ending call:", error);
        res.status(500).json({
            success: false,
            message: "Failed to end call",
            error: error.message
        });
    }
};

// Get call history
const getCallHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const calls = await Call.find({
            $or: [
                { callerId: userId },
                { receiverId: userId }
            ]
        })
        .populate('callerId', 'fullname email')
        .populate('receiverId', 'fullname email')
        .sort({ createdAt: -1 })
        .limit(50);

        res.status(200).json({
            success: true,
            message: "Call history retrieved successfully",
            data: calls
        });

    } catch (error) {
        console.error("Error fetching call history:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch call history",
            error: error.message
        });
    }
};

// Get pending calls for a user
const getPendingCalls = async (req, res) => {
    try {
        const { userId } = req.params;

        const pendingCalls = await Call.find({
            receiverId: userId,
            status: 'pending'
        })
        .populate('callerId', 'fullname email')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Pending calls retrieved successfully",
            data: pendingCalls
        });

    } catch (error) {
        console.error("Error fetching pending calls:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending calls",
            error: error.message
        });
    }
};

module.exports = {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    getCallHistory,
    getPendingCalls
};
