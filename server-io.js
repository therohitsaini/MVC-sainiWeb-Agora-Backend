const { Server } = require("socket.io");
const { User } = require("./Modal/userSchema");
const { default: mongoose } = require("mongoose");
const { ChatList } = require("./Modal/chatListSchema");
const { MessageModal } = require("./Modal/messageSchema");
const sendFCM = require("./firebase/sendNotification");
const { TransactionHistroy } = require("./Modal/transactionHistroy");
const { shopModel } = require("./Modal/shopify");

const ioServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["*"]
        }
    });

    let onlineUsers = {};
    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);
        socket.on("register", async (user_Id) => {
            if (!mongoose.Types.ObjectId.isValid(user_Id)) {
                console.log("Invalid userId received:", user_Id);
                return;
            }
            const roomId = user_Id.toString();
            socket.join(roomId);
            onlineUsers[roomId] = socket.id;

            try {
                await User.findByIdAndUpdate(roomId, { isActive: true });
            } catch (err) {
                console.error("Error updating user active status:", err);
            }
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
                        lastMessageTime: timestamp
                    }]);
                } else {
                    await ChatList.updateOne(
                        { _id: existingChat._id },
                        { lastMessage: text, lastMessageTime: timestamp },
                        { session }
                    );
                }

                const savedChat = await MessageModal.create([{
                    senderId,
                    receiverId,
                    shop_id,
                    text,
                    timestamp,
                    isRead: false
                }], { session });

                await session.commitTransaction();

                io.emit("receiveMessage", savedChat[0]);

                const receiver = await User.findById(receiverId);
                if (receiver?.firebaseToken?.token && !receiver?.isActive) {
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

        // socket.on("acceptUserChat", async (acceptData) => {
        //     const { userId, shopId, consultantId } = acceptData;
        //     console.log("acceptUserChat____________", userId, shopId, consultantId);

        //     console.log("acceptUserChat____________", userId);
        //     if (!mongoose.Types.ObjectId.isValid(userId)) {
        //         console.log("❌ Invalid userId received:", userId);
        //         return;
        //     }
        //     const user = await User.findById(userId);
        //     console.log("user", user.isChatAccepted);
        //     if (!user) {
        //         console.log("❌ User not found:", userId);
        //         return;
        //     }
        //     if (user.isChatAccepted === "request") {
        //         user.isChatAccepted = "accepted";
        //         await user.save();
        //         await TransactionHistroy.updateOne(
        //             { senderId: userId, receiverId: consultantId, shop_id: shopId },
        //             { $set: { acceptedAt: new Date() } }
        //         );
        //         console.log("user____________", user.isChatAccepted);
        //     } else {
        //         console.log("❌ User chat already accepted:", userId);
        //         return;
        //     }




        //     // io.to(id).emit("userChatAccepted", { message: user.isChatAccepted });
        //     // console.log("✅ User chat accepted:", user.isChatAccepted);
        // })




        // socket.on("call-user", async ({ toUid, fromUid, type, channelName }) => {
        //     try {
        //         const caller = await User.findById(fromUid).select("walletBalance").lean();
        //         const callerConsultant = await User.findById(toUid).select("fees").lean();

        //         const callCost = callerConsultant.fees;

        //         if (!caller || Number(caller.walletBalance) < callCost) {
        //             console.log(" Insufficient balance, Please recharge your wallet.");
        //             socket.emit("call-failed", { message: "Insufficient balance. Call cannot be connected." });
        //             return;
        //         }
        //         const receiverSocketId = onlineUsers[toUid];
        //         if (receiverSocketId) {
        //             io.to(receiverSocketId).emit("incoming-call", {
        //                 fromUid,
        //                 type,
        //                 channelName
        //             });
        //         } else {
        //             console.log(` User ${toUid} is offline`);
        //         }
        //     } catch (error) {
        //         console.error("Error in call-user:", error);

        //     }
        // });
        // socket.on("call-accepted", async ({ toUid, fromUid, type, channelName }) => {
        //     try {
        //         await HistroyMW(toUid, fromUid, type);
        //     } catch (error) {
        //         console.error("Error in call-accepted:", error);
        //     }

        //     const callerSocketId = onlineUsers[fromUid];
        //     const receiverSocketId = onlineUsers[toUid];
        //     if (callerSocketId) {
        //         io.to(callerSocketId).emit("call-accepted", { toUid, type, channelName });
        //     }
        //     if (receiverSocketId) {
        //         io.to(receiverSocketId).emit("call-accepted", { fromUid, type, channelName });
        //     }

        //     let chargePerMinute = await User.findById(fromUid).select("fees").lean();
        //     const rate = chargePerMinute.fees;
        //     const intervalId = setInterval(async () => {
        //         try {
        //             let fromObjectId;
        //             try {
        //                 fromObjectId = new mongoose.Types.ObjectId(toUid);
        //             } catch (e) {
        //                 console.error("Invalid fromUid ObjectId:", toUid);
        //                 clearInterval(intervalId);
        //                 if (callerSocketId) {
        //                     io.to(callerSocketId).emit("call-ended", { reason: "Invalid caller ID" });
        //                 }
        //                 return;
        //             }
        //             const currentUser = await User.findById(fromObjectId).select("walletBalance").lean();
        //             const numericBalance = Number(currentUser && currentUser.walletBalance);

        //             if (!currentUser || Number.isNaN(numericBalance)) {
        //                 clearInterval(intervalId);
        //                 if (callerSocketId) {
        //                     io.to(callerSocketId).emit("call-ended", { reason: "Caller not found" });
        //                 }
        //                 return;
        //             }

        //             if (numericBalance < Number(rate)) {
        //                 clearInterval(intervalId);
        //                 if (callerSocketId) {
        //                     io.to(callerSocketId).emit("call-ended", { reason: "Insufficient balance" });
        //                 }

        //                 return;
        //             }

        //             const updatedCaller = await User.findByIdAndUpdate(
        //                 fromObjectId,
        //                 { $inc: { walletBalance: -Number(rate) } },
        //                 { new: true }
        //             ).lean();

        //             if (!updatedCaller) {
        //                 clearInterval(intervalId);
        //                 if (callerSocketId) {
        //                     io.to(callerSocketId).emit("call-ended", { reason: "Insufficient balance" });
        //                 }

        //                 return;
        //             }

        //         } catch (err) {
        //             console.error("Error deducting balance:", err);
        //             clearInterval(intervalId);
        //         }
        //     }, 60 * 1000);

        //     socket.callIntervalId = intervalId;
        // });

        // socket.on("call-rejected", ({ toUid, fromUid }) => {
        //     const callerSocketId = onlineUsers[toUid];
        //     if (callerSocketId) {
        //         io.to(callerSocketId).emit("call-rejected", { fromUid });
        //         console.log(` Call rejected by ${fromUid} for caller ${toUid}`);
        //     } else {
        //         console.log(` Caller ${toUid} is offline`);
        //     }
        // });

        // socket.on("call-ended", async ({ fromUid, toUid }) => {

        //     try {

        //         const conversation = await Conversation.findOne({
        //             consultantId: fromUid,
        //             userId: toUid,
        //             endTime: { $exists: false }
        //         });

        //         if (conversation) {
        //             const endTime = new Date();
        //             const durationSeconds = Math.floor((endTime - conversation.startTime) / 1000);

        //             await Conversation.findByIdAndUpdate(conversation._id, {
        //                 endTime: endTime,
        //                 durationSeconds: durationSeconds
        //             });


        //         } else {
        //             console.log(" No active conversation found to end");
        //         }
        //     } catch (error) {
        //         console.error(" Error updating conversation:", error);
        //     }


        //     const receiverSocketId = onlineUsers[toUid];
        //     if (receiverSocketId) {
        //         io.to(receiverSocketId).emit("call-ended", { fromUid });
        //     }
        // });
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

            console.log("✅ Chat accepted & timer started");
        });

        socket.on("endChat", async (data) => {
            const { transactionId, userId, consultantId, shopId } = data;
            console.log("transactionId", transactionId);
            console.log("userId", userId);
            console.log("consultantId", consultantId);
            console.log("shopId", shopId);
            const transaction = await TransactionHistroy.findById(transactionId);
            if (!transaction) return;
            const consultantCost = await User.findById(consultantId);
            if (!consultantCost) return;
            const consultantChatCost = consultantCost.chatCost;
            if (!consultantChatCost) return;
            const shop = await shopModel.findById(shopId);
            if (!shop) return;
            const shopPercentage = Number(shop.adminPersenTage);
            if (!shopPercentage) return;

            const endTime = new Date();
            const totalSeconds = Math.floor(
                (endTime - new Date(transaction.startTime)) / 1000
            );
            console.log("totalSeconds", totalSeconds);

            // const totalMinutes = Math.ceil(totalSeconds / 60);
            // const totalAmount = totalMinutes * consultantChatCost;
            // ✅ PER-SECOND BILLING LOGIC
            const perSecondCost = consultantChatCost / 60;
            const totalAmount = Number((totalSeconds * perSecondCost).toFixed(2));


            const adminCommission = totalAmount * shopPercentage / 100;
            const consultantShare = totalAmount - adminCommission;
            const shopShare = adminCommission;
            console.log("adminCommission", adminCommission);
            console.log("consultantShare", consultantShare);
            console.log("shopShare", shopShare);
            // 4️⃣ Update transaction
            transaction.endTime = endTime;
            transaction.totalSeconds = totalSeconds;
            transaction.totalAmount = totalAmount;
            transaction.status = "completed";
            await transaction.save();

            // 5️⃣ Wallet update (safe)
            await User.findByIdAndUpdate(userId, {
                $inc: { walletBalance: -totalAmount }
            });

            await User.findByIdAndUpdate(consultantId, {
                $inc: { walletBalance: consultantShare }
            });

            await shopModel.findByIdAndUpdate(shopId, {
                $inc: { adminWalletBalance: shopShare }
            });
            await TransactionHistroy.findByIdAndUpdate(transactionId, {
                $inc: { adminAmount: adminCommission, consultantAmount: consultantShare, amount: totalAmount }
            });

            await User.findByIdAndUpdate(userId, {
                $set: { isChatAccepted: "request" }
            });


            io.to(userId).emit("chatEnded", {
                totalSeconds,
                totalAmount
            });

            io.to(consultantId).emit("chatEnded", {
                totalSeconds,
                totalAmount
            });

            console.log("✅ Chat ended:", transactionId);
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
                    } catch (err) {
                        console.error("Error updating user inactive status:", err);
                    }
                }
            }
        });
    });


};

module.exports = { ioServer };
