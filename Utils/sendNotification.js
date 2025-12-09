const admin = require("firebase-admin");
// const serviceAccount = require("../serviceAccountKey.json");


const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

if (!serviceAccount) {
    console.error("Firebase service account configuration is missing in environment variables.");
    process.exit(1);
}

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