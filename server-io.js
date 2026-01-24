const { Server } = require("socket.io");
const { User } = require("./Modal/userSchema");
const { default: mongoose } = require("mongoose");
const { ChatList } = require("./Modal/chatListSchema");
const { MessageModal } = require("./Modal/messageSchema");
const sendFCM = require("./firebase/sendNotification");
const { TransactionHistroy } = require("./Modal/transactionHistroy");
const { shopModel } = require("./Modal/shopify");
const { missCalled } = require("./Modal/miscallasHistroy");
const { WalletHistory } = require("./Modal/walletHistory");

const ioServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["*"]
        }
    });

    const onlineUsers = new Map();
    let activeCalls = new Map();
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("register", async (user_Id) => {
            if (!mongoose.Types.ObjectId.isValid(user_Id)) return;

            const uid = user_Id.toString();
            socket.join(uid);

            onlineUsers.set(uid, socket.id);

            console.log("🟢 ONLINE USERS:", [...onlineUsers.entries()]);

            await User.findByIdAndUpdate(uid, { isActive: true });
        });

        socket.on("sendMessage", async (data) => {
            const { senderId, receiverId, shop_id, text, timestamp } = data;

            if (!senderId || !receiverId || !shop_id) {
                console.log(" Missing required IDs");
                return;
            }
            try {
                const sender = await User.findById(senderId);
                if (!sender) throw new Error("Sender not found");

                /**
                 * if sender is customer then deduct the amount from sender's
                 *  wallet and add the amount to receiver's wallet and add the admin commission to the shop's wallet
                 *  and create a transaction record in the database
                 */

                if (sender.userType === "customer") {
                    const receiver = await User.findById(receiverId);
                    if (!receiver) throw new Error("Receiver not found");
                    const chatCost = Number(receiver.chatCost);

                    if (Number(sender.walletBalance) < chatCost) {
                        io.to(senderId.toString()).emit("balanceError", {
                            message: "Insufficient wallet balance",
                            required: chatCost,
                            available: sender.walletBalance
                        });
                        return;
                    }
                }

                const existingChat = await ChatList.findOne({
                    senderId,
                    receiverId,
                    shop_id
                });

                if (!existingChat) {
                    await ChatList.create([{
                        senderId,
                        receiverId,
                        shop_id,
                        lastMessage: text,
                        lastMessageTime: timestamp,
                        isRequest: false
                    }]);
                } else {
                    await ChatList.updateOne(
                        { _id: existingChat._id },
                        { lastMessage: text, lastMessageTime: timestamp },

                    );
                }

                const savedChat = await MessageModal.create({
                    senderId,
                    receiverId,
                    shop_id,
                    text,
                    timestamp,
                    isRead: false
                });

                const senderInfo = await User.findById(senderId)
                    .select("fullname profileImage")
                    .lean();

                const messageWithSender = {
                    ...savedChat.toObject(), // ✅ now works
                    senderName: senderInfo?.fullname || "User",
                    avatar: senderInfo?.profileImage || null
                };

                io.emit("receiveMessage", messageWithSender);



                // io.emit("receiveMessage", savedChat[0]);

                const receiver = await User.findById(receiverId);
                if (receiver?.firebaseToken?.token && !receiver?.isActive) {
                    console.log("receiver.firebaseToken.token", receiver.firebaseToken.token);
                    await sendFCM(
                        receiver.firebaseToken.token,
                        "New Message",
                        text,
                        "https://i.pinimg.com/736x/95/2a/ae/952aaea466ae9fb09f02889d33967cf6.jpg"
                    );
                }

            } catch (error) {
                console.error("❌ Transaction failed:", error);
            }
        });

        // ------------- call user --------------//

        socket.on("call-user", async ({ callerId, receiverId, channelName, callType }) => {
            try {
                if (!callerId || !receiverId || !channelName || !callType) {
                    console.log("❌ Missing required fields");
                    return;
                }
                console.log("❌❌❌❌❌ caller is calling to receiver", callerId, receiverId)
                const callerInfo = await User.findById({ _id: callerId });
                if (!callerInfo) throw new Error("Caller not found");
                if (callerInfo.userType === "customer") {
                    let isCallTypeCost = callType === "voice" ? "voiceCallCost" : "videoCallCost";

                    const receiverInfo = await User.findById({ _id: receiverId }).select(isCallTypeCost).lean();
                    if (!receiverInfo) throw new Error("Receiver not found");

                    const callCost = Number(receiverInfo[isCallTypeCost]);
                    if (Number(callerInfo.walletBalance) < callCost) {
                        io.to(callerId.toString()).emit("balanceError", {
                            message: "Insufficient wallet balance",
                            required: callCost,
                            available: callerInfo.walletBalance,
                        });
                        return;
                    }
                }

                const callId = `${callerId}_${receiverId}_${channelName}`;
                const user_ = await User.findById(callerId).select("fullname walletBalance");
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("incoming-call", {
                        callerId,
                        callerName: user_?.fullname || "Unknown",
                        callType,
                        channelName
                    });
                }
                const call = {
                    callId,
                    callerId,
                    receiverId,
                    channelName,
                    callType,
                    status: "ringing",
                    startedAt: Date.now(),
                    timeout: null
                };

                activeCalls.set(callId, call);

                call.timeout = setTimeout(async () => {
                    const activeCall = activeCalls.get(callId);
                    if (!activeCall) {
                        console.log("❌ Call not found");
                        return;
                    }

                    if (activeCall.status === "ringing") {
                        activeCall.status = "missed";
                        const callerSocketId = onlineUsers.get(callerId);
                        const receiverSocketId = onlineUsers.get(receiverId);
                        console.log("callerSokect_Caller", callerSocketId)
                        console.log("callerSokect_Receiver", receiverSocketId)

                        if (callerSocketId) {
                            io.to(callerSocketId).emit("call-missed", { callId });
                            console.log("auto call end event fire ")
                        }

                        if (receiverSocketId) {
                            io.to(receiverSocketId).emit("call-missed", { callId });
                        }

                        await missCalled.create({
                            senderId: callerId,
                            receiverId,
                            type: callType,
                            reason: "timeout"
                        });

                        activeCalls.delete(callId);
                        console.log("📞 Call auto-ended (missed):", callId);
                    }
                }, 20000);

            } catch (error) {
                console.error("❌ Error in call-user:", error);
            }
        });

        //---------------- accept call logics ----------------

        socket.on("call-accepted", async ({ callerId, receiverId, channelName, callType, shopId }) => {
            try {
                if (!callerId || !receiverId || !channelName || !callType) {
                    console.log(" Missing required fields");
                    return;
                }

                const callId = `${callerId}_${receiverId}_${channelName}`;
                const call = activeCalls.get(callId);

                if (!call) {
                    console.log("❌ Call not found");
                    return;
                }

                call.status = "accepted";
                clearTimeout(call.timeout);
                const transaction = await TransactionHistroy.create({
                    senderId: callerId,
                    receiverId: receiverId,
                    shop_id: shopId,
                    startTime: new Date(),
                    status: "active",
                    type: callType,
                    duration: 0
                });
                await transaction.save();
                const callerSocketId = onlineUsers.get(callerId);
                const receiverSocketId = onlineUsers.get(receiverId);
                if (callerSocketId) {
                    io.to(callerSocketId).emit("call-accepted-started", { callerId, receiverId, channelName, callType, transactionId: transaction._id });
                }
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("call-accepted-started", { callerId, receiverId, channelName, callType, transactionId: transaction._id });
                }
                const callerInfo = await User.findById(callerId);
                let userBalance = Number(callerInfo?.walletBalance);
                const receiverInfo = await User.findById(receiverId);
                const receiverCallCost = Number(receiverInfo?.[callType === "voice" ? "voiceCallCost" : "videoCallCost"]);
                const perSecondCost = receiverCallCost / 60;
                if (userBalance < perSecondCost) {
                    console.log("Insufficient balance to start call");
                    return;
                }
                const maxChatSeconds = Math.floor(userBalance / perSecondCost);
                const minutes = Math.floor(maxChatSeconds / 60);
                const seconds = maxChatSeconds % 60;

                console.log(`User can call for ${minutes} minutes and ${seconds} seconds`);
                let remainingBalance = userBalance;
                let chatSeconds = 0;
                const interval = setInterval(async () => {
                    if (remainingBalance >= perSecondCost) {
                        remainingBalance -= perSecondCost;
                        chatSeconds++;
                    } else {
                        clearInterval(interval);
                        transaction.duration = chatSeconds;
                        transaction.status = "completed";
                        transaction.endTime = new Date();
                        await transaction.save();
                        console.log("🔥 BACKEND: autoChatEnded EMIT", {
                            transactionId: transaction._id,
                            userId: callerId,
                            receiverId: receiverId
                        });

                        io.to(callerId).emit("autoCallEnded-no-balance", {
                            transactionId: transaction._id,
                            reason: "no-balance"
                        });

                        io.to(receiverId).emit("autoCallEnded-no-balance", {
                            transactionId: transaction._id,
                            reason: "no-balance"
                        });
                    }
                }, 1000);

            } catch (error) {
                console.error("Error in call-accepted:", error);
            }
        });

        //---------------- reject call logics ----------------

        socket.on("reject-call", async ({ callerId, receiverId, channelName, callType }) => {
            console.log("📥 reject-call from receiver", callerId, receiverId, channelName, callType);

            if (!callerId || !receiverId || !channelName || !callType) return;

            const callId = `${callerId}_${receiverId}_${channelName}`;
            const call = activeCalls.get(callId);
            if (!call) return;

            call.status = "rejected";
            clearTimeout(call.timeout);

            const callerSocketId = onlineUsers.get(callerId);
            const receiverSocketId = onlineUsers.get(receiverId);
            console.log("callerSocketId___Rejected", callerSocketId)
            console.log("receiverSocketId___Rejected", receiverSocketId)
            const payload = { callerId, receiverId, channelName, callType };

            if (callerId) {
                console.log("callerSocketId___Rejected_EMIT", callerSocketId)
                io.to(callerSocketId).emit("call-ended-rejected", payload);
            }
            if (receiverId) {
                console.log("receiverSocketId___Rejected_EMIT", receiverSocketId)
                io.to(receiverSocketId).emit("call-ended-rejected", payload);
            }
            console.log("activeCalls___Rejected", activeCalls)

            activeCalls.delete(callId);
            await missCalled.create({
                senderId: callerId,
                receiverId,
                type: callType,
                reason: "rejected"
            });

            console.log("📞 Call rejected & ended for both:", callId);
        });


        socket.on("acceptUserChat", async (acceptData) => {
            const { userId, shopId, consultantId } = acceptData;
            if (!mongoose.Types.ObjectId.isValid(userId)) return;

            const user = await User.findById(userId);
            if (!user || user.isChatAccepted !== "request") return;

            user.isChatAccepted = "accepted";
            await user.save();

            const transaction = await TransactionHistroy.create({
                senderId: userId,
                receiverId: consultantId,
                shop_id: shopId,
                startTime: new Date(),
                status: "active",
                type: "chat"
            });

            io.to(userId).emit("chatTimerStarted", {
                transactionId: transaction._id,
                startTime: transaction.startTime,
                consultantId,
                shopId
            });

            io.to(consultantId).emit("chatTimerStarted", {
                transactionId: transaction._id,
                startTime: transaction.startTime,
                userId,
                shopId
            });
            let userBalance = Number(user?.walletBalance);
            const consultantCost = await User.findById(consultantId);
            const consultantChatCost = Number(consultantCost?.chatCost);
            const perSecondCost = consultantChatCost / 60;
            if (userBalance < perSecondCost) {
                console.log("Insufficient balance to start chat");
                return;
            }
            const maxChatSeconds = Math.floor(userBalance / perSecondCost);
            const minutes = Math.floor(maxChatSeconds / 60);
            const seconds = maxChatSeconds % 60;

            console.log(`User can chat for ${minutes} minutes and ${seconds} seconds`);
            let remainingBalance = userBalance;
            let chatSeconds = 0;

            const interval = setInterval(() => {
                if (remainingBalance >= perSecondCost) {
                    remainingBalance -= perSecondCost;
                    chatSeconds++;
                } else {
                    clearInterval(interval);
                    console.log("🔥 BACKEND: autoChatEnded EMIT", {
                        transactionId: transaction._id,
                        userId,
                        consultantId
                    });

                    io.to(userId).emit("autoChatEnded", {
                        transactionId: transaction._id,
                        reason: "auto-ended"
                    });

                    io.to(consultantId).emit("autoChatEnded", {
                        transactionId: transaction._id,
                        reason: "auto-ended"
                    });
                }
            }, 1000);

        });

        //---------------- end call logics ----------------

        socket.on("call-ended", async (data) => {
            const { transactionId, callerId, receiverId, shopId, callType } = data;

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const transaction = await TransactionHistroy.findById(transactionId).session(session);
                if (!transaction) throw new Error("Transaction not found");

                const caller = await User.findById(callerId).session(session);
                if (!caller) throw new Error("Caller not found");

                const receiver = await User.findById(receiverId).session(session);
                if (!receiver) throw new Error("Receiver not found");

                const shop = await shopModel.findById(shopId).session(session);
                if (!shop) throw new Error("Shop not found");
                const balanceBefore = caller.walletBalance;
                const endTime = new Date();
                const totalSeconds = Math.floor(
                    (endTime - new Date(transaction.startTime)) / 1000
                );

                const callCostPerMinute =
                    callType === "voice"
                        ? Number(receiver.voiceCallCost)
                        : Number(receiver.videoCallCost);

                const perSecondCost = callCostPerMinute / 60;

                const totalAmount = Number((totalSeconds * perSecondCost).toFixed(2));

                const adminCommission =
                    (totalAmount * Number(shop.adminPersenTage)) / 100;

                const receiverShare = totalAmount - adminCommission;
                const shopShare = adminCommission;

                transaction.endTime = endTime;
                transaction.duration = totalSeconds;
                transaction.totalAmount = totalAmount;
                transaction.status = "completed";
                transaction.type = callType;

                await transaction.save({ session });

                await User.findByIdAndUpdate(
                    callerId,
                    { $inc: { walletBalance: -totalAmount } },
                    { session }
                );

                await User.findByIdAndUpdate(
                    receiverId,
                    { $inc: { walletBalance: receiverShare } },
                    { session }
                );

                await shopModel.findByIdAndUpdate(
                    shopId,
                    { $inc: { adminWalletBalance: shopShare } },
                    { session }
                );

                await TransactionHistroy.findByIdAndUpdate(
                    transactionId,
                    {
                        $inc: {
                            adminAmount: adminCommission,
                            consultantAmount: receiverShare,
                            amount: totalAmount
                        }
                    },
                    { session }
                );

                await User.findByIdAndUpdate(
                    callerId,
                    { $set: { isCallAccepted: false } },
                    { session }
                );

                await WalletHistory.create({
                    userId: callerId,
                    shop_id: shopId,
                    amount: totalAmount,
                    referenceType: callType,
                    direction: "debit",
                    description: `Call ended for ${totalSeconds} seconds`,
                    status: "success",
                });

                await session.commitTransaction();

                io.to(callerId).emit("callEnded", {
                    transactionId,
                    totalSeconds,
                    totalAmount,
                    reason: "ended"
                });

                io.to(receiverId).emit("callEnded", {
                    transactionId,
                    totalSeconds,
                    totalAmount,
                    reason: "ended"
                });

                console.log("✅ Call ended successfully:", transactionId);

            } catch (error) {
                console.error("❌ Call transaction error:", error);
                await session.abortTransaction();
            } finally {
                session.endSession();
            }
        });


        socket.on("endChat", async (data) => {
            const { transactionId, userId, consultantId, shopId } = data;
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                const transaction = await TransactionHistroy.findById(transactionId).session(session);
                if (!transaction) throw new Error("Transaction not found");

                const consultantCost = await User.findById(consultantId).session(session);
                if (!consultantCost) throw new Error("Consultant not found");

                const shop = await shopModel.findById(shopId).session(session);
                if (!shop) throw new Error("Shop not found");
                const user_ = await User.findById(userId).session(session);
                if (!user_) throw new Error("User not found");
                const endTime = new Date();
                const totalSeconds = Math.floor((endTime - new Date(transaction.startTime)) / 1000);
                const perSecondCost = consultantCost.chatCost / 60;
                const totalAmount = Number((totalSeconds * perSecondCost).toFixed(2));
                const adminCommission = totalAmount * Number(shop.adminPersenTage) / 100;
                const consultantShare = totalAmount - adminCommission;
                const shopShare = adminCommission;
                transaction.endTime = endTime;
                transaction.totalSeconds = totalSeconds;
                transaction.totalAmount = totalAmount;
                transaction.status = "completed";
                await transaction.save({ session });
                console.log("totalAmount", totalAmount)
                await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -totalAmount } }, { session });
                await User.findByIdAndUpdate(consultantId, { $inc: { walletBalance: consultantShare } }, { session });
                await shopModel.findByIdAndUpdate(shopId, { $inc: { adminWalletBalance: shopShare } }, { session });

                await TransactionHistroy.findByIdAndUpdate(transactionId, {
                    $inc: { adminAmount: adminCommission, consultantAmount: consultantShare, amount: totalAmount }
                }, { session });

                await User.findByIdAndUpdate(userId, { $set: { isChatAccepted: "request" } }, { session });

                await WalletHistory.create({
                    userId: userId,
                    shop_id: shopId,
                    amount: totalAmount,
                    transactionType: "usage",
                    referenceType: "chat",
                    direction: "debit",
                    description: `Chat ended for ${Number((totalSeconds / 60).toFixed(2))} minutes`,
                    status: "success",
                });
                await WalletHistory.create({
                    userId: consultantId,
                    shop_id: shopId,
                    amount: consultantShare,
                    transactionType: "usage",
                    referenceType: "chat",
                    direction: "credit",
                    description: `Chat ended for ${Number((totalSeconds / 60).toFixed(2))} minutes`,
                    status: "success",
                });

                await session.commitTransaction();

                io.to(userId).emit("chatEnded", { transactionId, totalSeconds, totalAmount, reason: "ended" });
                io.to(consultantId).emit("chatEnded", { transactionId, totalSeconds, totalAmount, reason: "ended" });

                console.log("✅ Chat ended:", transactionId);

            } catch (error) {
                console.log("Transaction error:", error);
                await session.abortTransaction();
            } finally {
                session.endSession();
            }
        });

        socket.on("disconnect", async () => {
            console.log("❌ Socket disconnected:", socket.id);

            for (const [uid, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    onlineUsers.delete(uid);

                    console.log("👤 User disconnected:", uid);
                    console.log(
                        "📊 Remaining online users:",
                        Array.from(onlineUsers.keys())
                    );

                    try {
                        await User.findByIdAndUpdate(uid, { isActive: false });
                    } catch (err) {
                        console.error("Error updating user inactive status:", err);
                    }

                    break;
                }
            }
        });

    });


};

module.exports = { ioServer };
