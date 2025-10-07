const { Server } = require("socket.io");
const User = require("./Modal/userSchema");
const { default: mongoose } = require("mongoose");
const { consultantSchemaExport } = require("./Modal/consultantSchema");


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
                console.log("❌ Invalid userId received:", userId);
                return;
            }
            onlineUsers[userId] = socket.id;
            try {
                await User.findByIdAndUpdate(userId, { isActive: true });
            } catch (err) {
                console.error("Error updating user active status:", err);
            }
        });

        socket.on("call-user", async ({ toUid, fromUid, type, channelName }) => {
            let callCost = 1
            try {
                const caller = await User.findById(fromUid).select("walletBalance").lean();
              
                if (!caller || Number(caller.walletBalance) < callCost) {
                    console.log(" Insufficient balance, blocking call.");
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
            console.log("fromUid type:", typeof fromUid, "value:", fromUid);
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
            // type === "video" ? 2 : 1;
            console.log("chargePerMinute", chargePerMinute);
            console.log("rate", rate);
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
        socket.on("call-ended", ({ fromUid, toUid }) => {
            // clearInterval(socket.callIntervalId);
            const receiverSocketId = onlineUsers[toUid];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("call-ended", { fromUid });
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
                    } catch (err) {
                        console.error("Error updating user inactive status:", err);
                    }
                }
            }
        });
    });


};

module.exports = { ioServer };
