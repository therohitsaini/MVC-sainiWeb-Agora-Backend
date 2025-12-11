// const admin = require("../firebase/firebase");
// async function sendFCM(token, title, body) {
//     const message = {
//         notification: { title, body },
//         token,
//     };

//     try {
//         const res = await admin.messaging().send(message);
//         console.log("FCM sent:", res);
//     } catch (err) {
//         console.error("FCM Error:", err);
//     }
// }

// module.exports = sendFCM;


const admin = require("../firebase/firebase");

async function sendFCM(token, title, body, avatar) {
    const message = {
        token,
        data: {
            title: title,
            body: body,
            avatar: avatar || "",   // optional
        },
        android: {
            priority: "high",
        },
        apns: {
            payload: {
                aps: {
                    contentAvailable: true,
                },
            },
        },
    };

    try {
        const res = await admin.messaging().send(message);
        console.log("FCM sent:", res);
    } catch (err) {
        console.error("FCM Error:", err);
    }
}

module.exports = sendFCM;
