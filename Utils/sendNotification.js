const admin = require("firebase-admin");
// const serviceAccount = require("../serviceAccountKey.json");


const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully");
}


const sendPushNotification = async (token, messageData) => {
    try {
        const message = {
            token: token,
            notification: {
                title: messageData.title,
                body: messageData.body,
            },
        };

        await admin.messaging().send(message);

        console.log("Notification sent!");
    } catch (error) {
        console.log("Error sending notification:", error);
    }
}

module.exports = { sendPushNotification };