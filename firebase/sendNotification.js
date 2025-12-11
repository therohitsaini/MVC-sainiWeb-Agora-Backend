const admin = require("../firebase/firebase");
async function sendFCM(token, title, body) {
    const message = {
        notification: { title, body },
        token,
    };

    try {
        const res = await admin.messaging().send(message);
        console.log("FCM sent:", res);
    } catch (err) {
        console.error("FCM Error:", err);
    }
}

module.exports = sendFCM;
