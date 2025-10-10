const { Server } = require("socket.io");
const User = require("./Modal/userSchema");
const { default: mongoose } = require("mongoose");
const { consultantSchemaExport } = require("./Modal/consultantSchema");
const { Conversation } = require("./Modal/Histroy");
const { HistroyMW } = require("./Socket-Io-MiddleWare/HistroyMW");
const { Message } = require("./Modal/messageSchema");


const ioServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["*"]
        }
    });


    let onlineUsers = {};

    io.on("connection", (socket) => {

        socket.on("register", async (userId) => {
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                console.log(" Invalid userId received:", userId);
                return;
            }

            onlineUsers[userId] = socket.id;

            try {
                await User.findByIdAndUpdate(userId, { isActive: true });
                await consultantSchemaExport.findByIdAndUpdate(userId, { isActive: true });
            } catch (err) {
                console.error("Error updating user active status:", err);
            }
        });

        socket.on("call-user", async ({ toUid, fromUid, type, channelName }) => {
            try {
                const caller = await User.findById(fromUid).select("walletBalance").lean();
                const callerConsultant = await consultantSchemaExport.findById(toUid).select("fees").lean();

                const callCost = callerConsultant.fees;
                console.log("callCost", callCost);
                if (!caller || Number(caller.walletBalance) < callCost) {
                    console.log(" Insufficient balance, Please recharge your wallet.");
                    socket.emit("call-failed", { message: "Insufficient balance. Call cannot be connected." });
                    return;
                }

                const receiverSocketId = onlineUsers[toUid];

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("incoming-call", {
                        fromUid,
                        type,
                        channelName
                    });
                } else {
                    console.log(` User ${toUid} is offline`);
                }
            } catch (error) {
                console.error("Error in call-user:", error);

            }
        });

        socket.on("call-accepted", async ({ toUid, fromUid, type, channelName }) => {
            console.log("call-accepted received:", { fromUid, toUid, type, channelName });

            try {
                await HistroyMW(toUid, fromUid, type);
            } catch (error) {
                console.error("Error in call-accepted:", error);
            }

            const callerSocketId = onlineUsers[fromUid];
            const receiverSocketId = onlineUsers[toUid];
            if (callerSocketId) {
                io.to(callerSocketId).emit("call-accepted", { toUid, type, channelName });
            }
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-accepted", { fromUid, type, channelName });
            }

            let chargePerMinute = await consultantSchemaExport.findById(fromUid).select("fees").lean();
            const rate = chargePerMinute.fees;
            const intervalId = setInterval(async () => {
                try {
                    let fromObjectId;
                    try {
                        fromObjectId = new mongoose.Types.ObjectId(toUid);
                    } catch (e) {
                        console.error("Invalid fromUid ObjectId:", toUid);
                        clearInterval(intervalId);
                        if (callerSocketId) {
                            io.to(callerSocketId).emit("call-ended", { reason: "Invalid caller ID" });
                        }
                        return;
                    }
                    console.log("fromObjectId", fromObjectId);
                    const currentUser = await User.findById(fromObjectId).select("walletBalance").lean();
                    const numericBalance = Number(currentUser && currentUser.walletBalance);
                    console.log("Current user balance:", numericBalance, "Rate:", rate);

                    if (!currentUser || Number.isNaN(numericBalance)) {
                        console.log("Caller not found or walletBalance not numeric");
                        clearInterval(intervalId);
                        if (callerSocketId) {
                            io.to(callerSocketId).emit("call-ended", { reason: "Caller not found" });
                        }
                        return;
                    }

                    if (numericBalance < Number(rate)) {
                        clearInterval(intervalId);
                        if (callerSocketId) {
                            io.to(callerSocketId).emit("call-ended", { reason: "Insufficient balance" });
                        }
                        // if (receiverSocketId) {
                        //     io.to(receiverSocketId).emit("call-ended", { reason: "Insufficient balance" });
                        // }
                        return;
                    }

                    const updatedCaller = await User.findByIdAndUpdate(
                        fromObjectId,
                        { $inc: { walletBalance: -Number(rate) } },
                        { new: true }
                    ).lean();

                    // const updatedReceiver = await User.findOneAndUpdate(
                    //     { _id: toUid, walletBalance: { $gte: rate } },
                    //     { $inc: { walletBalance: -rate } },
                    //     { new: true }
                    // );
                    console.log("updatedCaller", updatedCaller);

                    if (!updatedCaller) {
                        clearInterval(intervalId);
                        if (callerSocketId) {
                            io.to(callerSocketId).emit("call-ended", { reason: "Insufficient balance" });
                        }
                        // if (receiverSocketId) {
                        //     io.to(receiverSocketId).emit("call-ended", { reason: "Insufficient balance" });
                        // }
                        return;
                    }

                } catch (err) {
                    console.error("Error deducting balance:", err);
                    clearInterval(intervalId);
                }
            }, 60 * 1000);

            socket.callIntervalId = intervalId;
        });

        socket.on("call-rejected", ({ toUid, fromUid }) => {
            console.log(` Call-rejected received:`, { toUid, fromUid });
            console.log(` Online users:`, onlineUsers);

            const callerSocketId = onlineUsers[toUid];
            console.log(` Caller socket ID for ${toUid}:`, callerSocketId);

            if (callerSocketId) {
                io.to(callerSocketId).emit("call-rejected", { fromUid });
                console.log(` Call rejected by ${fromUid} for caller ${toUid}`);
            } else {
                console.log(` Caller ${toUid} is offline`);
            }
        });

        socket.on("call-ended", async ({ fromUid, toUid }) => {
          
            try {
           
                const conversation = await Conversation.findOne({ 
                    consultantId: fromUid, 
                    userId: toUid,
                    endTime: { $exists: false } 
                });
                
                if (conversation) {
                    const endTime = new Date();
                    const durationSeconds = Math.floor((endTime - conversation.startTime) / 1000);
                    
                    await Conversation.findByIdAndUpdate(conversation._id, {
                        endTime: endTime,
                        durationSeconds: durationSeconds
                    });
                    
                    console.log(` Conversation ended: Duration ${durationSeconds} seconds`);
                } else {
                    console.log(" No active conversation found to end");
                }
            } catch (error) {
                console.error(" Error updating conversation:", error);
            }
            
            // clearInterval(socket.callIntervalId);
            const receiverSocketId = onlineUsers[toUid];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-ended", { fromUid });
            }
        });

        // ------------------------- CHAT EVENTS -------------------------
        // Start a chat conversation (consultant -> user)
        socket.on("chat-start", async ({ toUid, fromUid }) => {
            console.log("chat-start received:", { toUid, fromUid });
            try {
                await HistroyMW(toUid, fromUid, "chat");

                const activeConversation = await Conversation.findOne({
                    consultantId: fromUid,
                    userId: toUid,
                })
                .sort({ createdAt: -1 })
                .lean();

                if (activeConversation) {
                    const callerSocketId = onlineUsers[fromUid];
                    const receiverSocketId = onlineUsers[toUid];
                    const payload = { conversationId: activeConversation._id.toString() };
                    if (callerSocketId) io.to(callerSocketId).emit("chat-started", payload);
                    if (receiverSocketId) io.to(receiverSocketId).emit("chat-incoming", { fromUid, ...payload });
                }
            } catch (error) {
                console.error("Error in chat-start:", error);
                socket.emit("chat-error", { message: "Unable to start chat" });
            }
        });

        // Join a chat room using conversationId
        socket.on("chat-join", async ({ conversationId, userId }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    return socket.emit("chat-error", { message: "Invalid conversationId" });
                }
                const conversation = await Conversation.findById(conversationId).lean();
                if (!conversation) {
                    return socket.emit("chat-error", { message: "Conversation not found" });
                }
                const room = `conv:${conversationId}`;
                socket.join(room);
                socket.emit("chat-joined", { conversationId });
            } catch (error) {
                console.error("Error in chat-join:", error);
                socket.emit("chat-error", { message: "Unable to join chat" });
            }
        });

        // Send a chat message
        socket.on("chat-send", async ({ conversationId, fromUid, toUid, type = "text", content = "" }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    return socket.emit("chat-error", { message: "Invalid conversationId" });
                }
                const conversation = await Conversation.findById(conversationId).lean();
                if (!conversation) {
                    return socket.emit("chat-error", { message: "Conversation not found" });
                }
                const message = await Message.create({
                    conversationId,
                    senderId: fromUid,
                    receiverId: toUid,
                    type,
                    content
                });
                const room = `conv:${conversationId}`;
                io.to(room).emit("chat-message", {
                    _id: message._id,
                    conversationId,
                    fromUid,
                    toUid,
                    type: message.type,
                    content: message.content,
                    createdAt: message.createdAt
                });

                // Fallback direct emit if receiver not in room
                const receiverSocketId = onlineUsers[toUid];
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("chat-message", {
                        _id: message._id,
                        conversationId,
                        fromUid,
                        toUid,
                        type: message.type,
                        content: message.content,
                        createdAt: message.createdAt
                    });
                }
            } catch (error) {
                console.error("Error in chat-send:", error);
                socket.emit("chat-error", { message: "Unable to send message" });
            }
        });

        // Load chat history
        socket.on("chat-history", async ({ conversationId, limit = 50, before }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    return socket.emit("chat-error", { message: "Invalid conversationId" });
                }
                const query = { conversationId };
                if (before) {
                    query.createdAt = { $lt: new Date(before) };
                }
                const messages = await Message.find(query)
                    .sort({ createdAt: -1 })
                    .limit(Math.min(Number(limit) || 50, 200))
                    .lean();
                socket.emit("chat-history", { conversationId, messages: messages.reverse() });
            } catch (error) {
                console.error("Error in chat-history:", error);
                socket.emit("chat-error", { message: "Unable to fetch history" });
            }
        });

        // Typing indicator
        socket.on("chat-typing", ({ conversationId, userId, isTyping }) => {
            const room = `conv:${conversationId}`;
            socket.to(room).emit("chat-typing", { conversationId, userId, isTyping: !!isTyping });
        });

        // Mark messages as read
        socket.on("chat-read", async ({ conversationId, readerId, senderId }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    return socket.emit("chat-error", { message: "Invalid conversationId" });
                }
                const result = await Message.updateMany(
                    { conversationId, receiverId: readerId, senderId, status: { $ne: "read" } },
                    { $set: { status: "read", readAt: new Date() } }
                );
                const room = `conv:${conversationId}`;
                io.to(room).emit("chat-read", { conversationId, readerId, senderId, count: result.modifiedCount || 0 });
            } catch (error) {
                console.error("Error in chat-read:", error);
                socket.emit("chat-error", { message: "Unable to mark read" });
            }
        });

        // End chat conversation explicitly
        socket.on("chat-end", async ({ conversationId }) => {
            try {
                if (!mongoose.Types.ObjectId.isValid(conversationId)) {
                    return socket.emit("chat-error", { message: "Invalid conversationId" });
                }
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;
                if (!conversation.endTime) {
                    const endTime = new Date();
                    conversation.endTime = endTime;
                    conversation.durationSeconds = Math.floor((endTime - conversation.startTime) / 1000);
                    await conversation.save();
                }
                const room = `conv:${conversationId}`;
                io.to(room).emit("chat-ended", { conversationId });
            } catch (error) {
                console.error("Error in chat-end:", error);
                socket.emit("chat-error", { message: "Unable to end chat" });
            }
        });

        socket.on("disconnect", async () => {
            for (let uid in onlineUsers) {
                if (!mongoose.Types.ObjectId.isValid(uid)) {
                    console.log(" Invalid uid received:", uid);
                    return;
                }
                if (onlineUsers[uid] === socket.id) {
                    delete onlineUsers[uid];
                    console.log(" User disconnected:", uid);
                    console.log(" Remaining online users:", Object.keys(onlineUsers));
                    try {
                        await User.findByIdAndUpdate(uid, { isActive: false });
                        await consultantSchemaExport.findByIdAndUpdate(uid, { isActive: false });
                    } catch (err) {
                        console.error("Error updating user inactive status:", err);
                    }
                }
            }
        });
    });


};

module.exports = { ioServer };
