const { Server } = require("socket.io");
const User = require("./Modal/userSchema");

const ioServer = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["*"]
        }
    });


    let onlineUsers = {};

    io.on("connection", (socket) => {
        console.log(" New client connected:", socket.id);

        socket.on("register", (userId) => {
            onlineUsers[userId] = socket.id;
            console.log(" User registered:", userId, "Socket:", socket.id);
            console.log(" Current online users:", Object.keys(onlineUsers));
        });

        socket.on("call-user", async ({ toUid, fromUid, type, channelName }) => {
            let callCost = 1
            try {
                const caller = await User.findById(fromUid).select("walletBalance").lean();
                console.log("Caller fetched from DB:", caller?.walletBalance);
                console.log("Type of walletBalance:", typeof caller.walletBalance, "Value:", caller.walletBalance);
                console.log("Comparison result:", Number(caller.walletBalance) <= callCost);
                console.log("Call cost____TRF:", callCost);

                if (!caller || Number(caller.walletBalance) < callCost) {
                    console.log(" Insufficient balance, blocking call.");
                    socket.emit("call-failed", { message: "Insufficient balance. Call cannot be connected." });
                    return;
                }

                const receiverSocketId = onlineUsers[toUid];
                console.log(` Receiver socket ID for ${toUid}:`, receiverSocketId);

                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("incoming-call", {
                        fromUid,
                        type,
                        channelName
                    });
                    console.log(` Call notification sent from ${fromUid} to ${toUid} on channel ${channelName}`);
                } else {
                    console.log(` User ${toUid} is offline`);
                }
            } catch (error) {
                console.error("Error in call-user:", error);

            }
        });


        socket.on("call-accepted", ({ toUid, fromUid, type, channelName }) => {
            console.log(` Call-accepted received:`, { toUid, fromUid, type, channelName });
            console.log(` Online users:`, onlineUsers);

            const callerSocketId = onlineUsers[toUid];
            console.log(` Caller socket ID for ${toUid}:`, callerSocketId);

            if (callerSocketId) {
                io.to(callerSocketId).emit("call-accepted", {
                    fromUid,
                    type,
                    channelName
                });
                console.log(` Call accepted by ${fromUid} for caller ${toUid} on channel ${channelName}`);
            } else {
                console.log(` Caller ${toUid} is offline`);
            }
        });

        // Call rejected with debugging
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

        socket.on("disconnect", () => {
            for (let uid in onlineUsers) {
                if (onlineUsers[uid] === socket.id) {
                    delete onlineUsers[uid];
                    console.log(" User disconnected:", uid);
                    console.log(" Remaining online users:", Object.keys(onlineUsers));
                }
            }
        });
    });


};

module.exports = { ioServer };
