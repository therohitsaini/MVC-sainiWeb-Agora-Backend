const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        let serviceAccount = null;

        // Priority 1: Try environment variables
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            serviceAccount = {
                type: process.env.FIREBASE_TYPE || "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
                token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
                universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
            };
            console.log("✅ Using Firebase credentials from environment variables");
        }
        // Priority 2: Try serviceAccountKey.json file
        else {
            const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
            if (fs.existsSync(serviceAccountPath)) {
                serviceAccount = require(serviceAccountPath);
                console.log("✅ Using Firebase credentials from serviceAccountKey.json file");
            }
        }

        if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin initialized successfully");
        } else {
            console.warn("⚠️ Firebase Admin not initialized: Missing service account credentials");
        }
    } catch (error) {
        console.error("❌ Error initializing Firebase Admin:", error.message);
    }
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