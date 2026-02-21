const admin = require("../firebase/firebase");

async function sendCallFCM({
    token,
    callerId,
    callerName,
    channelName,
    callType,
    avatar
}) {
    const message = {
        token,
        data: {
            type: "CALL",
            callerId,
            callerName,
            channelName,
            callType, // voice | video
            avatar: avatar || "",
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

    await admin.messaging().send(message);
}

module.exports  = { sendCallFCM };
