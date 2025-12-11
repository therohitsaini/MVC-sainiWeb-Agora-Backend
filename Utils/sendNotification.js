const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        let serviceAccount = null;

        // Priority 1: Try serviceAccountKey.json file (Most Reliable)
        const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
        if (fs.existsSync(serviceAccountPath)) {
            try {
                serviceAccount = require(serviceAccountPath);
                // Validate private key format
                if (serviceAccount.private_key && serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
                    console.log("✅ Using Firebase credentials from serviceAccountKey.json file");
                } else {
                    console.warn("⚠️ Invalid private key format in serviceAccountKey.json");
                    serviceAccount = null;
                }
            } catch (err) {
                console.warn("⚠️ Error reading serviceAccountKey.json:", err.message);
                serviceAccount = null;
            }
        }
        
        // Priority 2: Try environment variables (if file doesn't exist or invalid)
        if (!serviceAccount && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
            try {
                // Fix private key format - handle multiple escape scenarios
                let privateKey = process.env.FIREBASE_PRIVATE_KEY;
                // Replace escaped newlines
                privateKey = privateKey.replace(/\\n/g, '\n');
                // If still has literal \n, replace those too
                privateKey = privateKey.replace(/\\\\n/g, '\n');
                
                // Validate private key format
                if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
                    throw new Error("Invalid private key format in environment variable");
                }
                
                serviceAccount = {
                    type: process.env.FIREBASE_TYPE || "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: privateKey,
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
                    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
                    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
                    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
                    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
                };
                console.log("✅ Using Firebase credentials from environment variables");
            } catch (envErr) {
                console.error("❌ Error parsing environment variables:", envErr.message);
                serviceAccount = null;
            }
        }

        // Initialize Firebase if we have valid credentials
        if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email) {
            try {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("✅ Firebase Admin initialized successfully");
            } catch (initError) {
                console.error("❌ Error initializing Firebase Admin:", initError.message);
                // Don't throw - let it fail gracefully
            }
        } else {
            console.warn("⚠️ Firebase Admin not initialized: Missing or invalid service account credentials");
        }
    } catch (error) {
        console.error("❌ Error initializing Firebase Admin:", error.message);
    }
}


const sendPushNotification = async (token, messageData) => {
    // Check if Firebase is initialized
    if (!admin.apps.length) {
        console.warn("⚠️ Firebase Admin not initialized. Skipping push notification.");
        return { success: false, error: "Firebase not initialized" };
    }

    if (!token) {
        console.warn("⚠️ No FCM token provided. Skipping push notification.");
        return { success: false, error: "No FCM token" };
    }

    try {
        const message = {
            token: token,
            notification: {
                title: messageData.title || "New Notification",
                body: messageData.body || "You have a new message",
            },
        };

        const response = await admin.messaging().send(message);
        console.log("✅ Notification sent successfully:", response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error("❌ Error sending notification:", error.message);
        
        // Handle invalid token errors
        if (error.code === "messaging/invalid-registration-token" || 
            error.code === "messaging/registration-token-not-registered") {
            console.warn("⚠️ Invalid or unregistered FCM token:", token);
            return { success: false, error: "Invalid token", shouldRemoveToken: true };
        }
        
        return { success: false, error: error.message };
    }
}

module.exports = { sendPushNotification };