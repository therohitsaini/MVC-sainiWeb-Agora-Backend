const { Server } = require("socket.io");
const { User } = require("./Modal/userSchema");
const { default: mongoose } = require("mongoose");

const { Conversation } = require("./Modal/Histroy");
const { HistroyMW } = require("./Socket-Io-MiddleWare/HistroyMW");
const { Message } = require("./Modal/messageSchema");
const { ChatList } = require("./Modal/chatListSchema");
const { MessageModal } = require("./Modal/messageSchema");


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
                console.log(" Invalid userId received:", user_Id);
                return;
            }
            onlineUsers[user_Id] = socket.id;
            console.log("🔥 Online users:", onlineUsers);
            console.log("🔥 User registered:", user_Id);
            if (user_Id) {
                await User.findByIdAndUpdate(user_Id, { isActive: true });
                console.log("🔥 User activated:", user_Id);
            } else {
                console.log("🔥 User not found:", user_Id);
            }
        });
        socket.on("sendMessage", async (data) => {
            console.log("MESSAGE RECEIVED:", data);

            const { senderId, receiverId, shop_id, text, timestamp } = data;
            console.log("get sender Ids", senderId, receiverId, shop_id, text)

            if (!senderId || !receiverId || !shop_id) {
                console.log(" Missing required IDs");
                return;
            }
            const existingChat = await ChatList.findOne({
                senderId,
                receiverId,
                shop_id
            });

            if (!existingChat) {
                console.log("🟢 Chat does NOT exist → creating new ChatList");

                await ChatList.create({
                    senderId,
                    receiverId,
                    shop_id,
                    lastMessage: text,
                    lastMessageTime: timestamp
                });
            } else {
                console.log("🟡 Chat already exists → SKIPPING create");

                // Optional: Only update last message time
                await ChatList.updateOne(
                    { _id: existingChat._id },
                    { lastMessage: text, lastMessageTime: timestamp }
                );
            }
            try {
                const receiverSocketId = onlineUsers[receiverId];
                const savedChat = new MessageModal({
                    senderId: senderId,
                    receiverId: receiverId,
                    shop_id: shop_id,
                    text: text,
                    timestamp: timestamp,
                    isRead: false
                });

                await savedChat.save();
                console.log("✅ Message saved to DB:", savedChat);
            
                    io.emit("receiveMessage", savedChat);
                    // .to(receiverSocketId)
           
            } catch (error) {   
                console.error("❌ Error saving message:", error);
            }


            // After validation + ChatList create/update → send msg to receiver
            // const receiverSocketId = users[receiverId];

            // if (receiverSocketId) {
            //     io.to(receiverSocketId).emit("receiveMessage", {
            //         senderId,
            //         text,
            //         timestamp
            //     });
            // }

            // // Also send back to sender UI
            // io.to(users[senderId]).emit("receiveMessage", {
            //     senderId,
            //     text,
            //     timestamp
            // });

        });



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
