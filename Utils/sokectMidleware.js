// const socketMiddleware = (io, socket) => {
//     socket.on("markSeen", async ({ senderId, receiverId }) => {
//         await MessageModal.updateMany(
//             { senderId, receiverId, seen: false },
//             { $set: { seen: true } }
//         );

//         io.to(senderId).emit("seenUpdate", { senderId: receiverId });
//     });

// }

// module.exports = socketMiddleware;