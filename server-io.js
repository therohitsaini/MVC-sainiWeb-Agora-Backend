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
        console.log("🔥 Socket connected:", socket.id);
        socket.on("register", async (user_Id) => {
            if (!mongoose.Types.ObjectId.isValid(user_Id)) {
                console.log("❌ Invalid userId received:", user_Id);
                return;
            }

            const roomId = user_Id.toString();
            socket.join(roomId);
            onlineUsers[roomId] = socket.id;
            console.log("User joined room:", roomId);

            try {
                await User.findByIdAndUpdate(roomId, { isActive: true });
            } catch (err) {
                console.error("❌ Error updating user active status:", err);
            }
        });

        socket.on("sendMessage", async (data) => {
            const { senderId, receiverId, shop_id, text, timestamp } = data;

            if (!senderId || !receiverId || !shop_id) {
                console.log("❌ Missing required IDs");
                return;
            }
            const session = await mongoose.startSession();
            try {
                session.startTransaction();

                const sender = await User.findById(senderId).session(session);
                if (!sender) throw new Error("Sender not found");


                /**
                 * if sender is customer then deduct the amount from sender's
                 *  wallet and add the amount to receiver's wallet and add the admin commission to the shop's wallet
                 *  and create a transaction record in the database
                 */

                if (sender.userType === "customer") {

                    const receiver = await User.findById(receiverId).session(session);
                    if (!receiver) throw new Error("Receiver not found");

                    const shop = await shopModel.findById(shop_id).session(session);
                    if (!shop) throw new Error("Shop not found");

                    const adminPercentage = shop.adminPersenTage;
                    const chatCost = Number(receiver.chatCost);

                    if (Number(sender.walletBalance) < chatCost) {
                        io.to(senderId.toString()).emit("balanceError", {
                            message: "Insufficient wallet balance",
                            required: chatCost,
                            available: sender.walletBalance
                        });

                        await session.abortTransaction();
                        return;
                    }

                    const adminCommission = (chatCost * adminPercentage) / 100;
                    const consultantAmount = chatCost - adminCommission;


                    await User.findByIdAndUpdate(
                        senderId,
                        { $inc: { walletBalance: -chatCost } },
                        { session }
                    );

                    // 2 Add consultant amount (after admin cut)
                    await User.findByIdAndUpdate(
                        receiverId,
                        { $inc: { walletBalance: consultantAmount } },
                        { session }
                    );
                    // (Optional)  Add admin commission to admin wallet
                    console.log("shop", adminCommission);
                    await shopModel.findByIdAndUpdate(
                        shop_id,
                        { $inc: { adminWalletBalance: adminCommission } },
                        { session }
                    );

                    await TransactionHistroy.create({
                        senderId,
                        receiverId,
                        shop_id,
                        amount: chatCost,
                        adminAmount: adminCommission,
                        consultantAmount: consultantAmount,
                        type: "chat",
                        debitFrom: senderId,
                        creditTo: receiverId
                    });
                }

                // =============================================== MESSAGE TRANSACTION LOGIC ===============================================

                const existingChat = await ChatList.findOne({
                    senderId,
                    receiverId,
                    shop_id
                }).session(session);

                if (!existingChat) {
                    await ChatList.create([{
                        senderId,
                        receiverId,
                        shop_id,
                        lastMessage: text,
                        lastMessageTime: timestamp
                    }], { session });
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
                await session.abortTransaction();
            } finally {
                session.endSession();
            }
        });
        
        socket.on("acceptUserChat", async (acceptData) => {
            const { userId, shopId, consultantId } = acceptData;
            console.log("acceptUserChat____________", userId, shopId, consultantId);
            // const id = userId.userId;
            // console.log("acceptUserChat____________", id);
            // if (!mongoose.Types.ObjectId.isValid(id)) {
            //     console.log("❌ Invalid userId received:", id);
            //     return;
            // }
            // const user = await User.findById(id);
            // console.log("user", user.isChatAccepted);
            // if (!user) {
            //     console.log("❌ User not found:", id);
            //     return;
            // }
            // if (user.isChatAccepted === "request") {
            //     user.isChatAccepted = "accepted";
            //     await user.save();
            //     console.log("user____________", user.isChatAccepted);
            // } else {
            //     console.log("❌ User chat already accepted:", id);
            //     return;
            // }


            // io.to(id).emit("userChatAccepted", { message: user.isChatAccepted });
            // console.log("✅ User chat accepted:", user.isChatAccepted);
        })




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
