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
                private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCFMfEAJAE75aaF\n2OtRoB3icn4uT+CvLhB+Tf88xO8RimM0pJB+8m2rN55svMqFw20Gl0f46DQALDXZ\nIQ9/DPzk7EslC0tQSydmffhvvHySwpbIJOCMnODoEnsA6g0zeO7jVe+llX8kQKF1\nHYQ9frFF9UhMutXmgUvMB+sCPDReidJA7zbCYTvy5B1T4r7B8o80cFgJPl0Siyas\ntjLDHvw2jkiGAa6zD6X3nC1k6sa7ywRP+VZ5Pr9WtQX4u03qU/ZY9sxiX5Xv4ZBb\nZexpGyUs7WdTlNmPTjhsZE9J0PeJ/wFuIdCMezArZfqA9tCvp3Tv7VadxJabphca\nI5r/LE+9AgMBAAECggEAIdpkp6V/Dss6vNA6Vx+8GL8C5SB2OfAaTw/h7H8dSDcF\nKe8drrZNO3RCdt6xFrhp8H/o0hGqjdSuxwYJG0Cg0kpgewTY2oqPdBRWXYfpnZ+J\nlUsSK4r/+twfmUbjng6BoRRJeat6iitHHi4nWz3lLqO+AYqHLTP1oODuUT4eDVza\nTqvAAO7B58OI7drUkpLf3qHFF7O1OlfZYFgjnUuZQWr6gG6YETE3fxQo539XRQv2\nrMJ0kYiB3foiBJ5v44D/zM8qEXHhN5dhSjwiuYsJno2EnNKbF5S/cD5f/z2kRqcJ\nwpok3yNuAb5uDmTt4VGNxiIcZ0QivTyncNgclj4kHQKBgQC5JcRD+mNef8syMtS/\nZgJ3hJ6VTRneMheXVMnr3CsYmEcTOFMRRC/Tka1TxLkJHumbEFXjo70eDMtlH3YL\ndRYakNC0ZzfCq+/FdFqM8f97KBTQA0tKeOvFOrIo+NeRuV3MaKxlrFfZyfYf2apx\nl2DdJEYHhaKl6ENjLnGJYvX9lwKBgQC4KpT316vvk7AjT9dimvlqJgroEvrgrwoG\nokzytF7NXSQfSfIrRq4jkn4mbfMVzx4vIKsJKFQKKKOPvzaXANbWBXyXgMIiZIhk\n92fhB7fDgcMx627kLqeQTZAG6HyMTz/WtTQjb72T3nTSQ8jqu6QA+EVyZA/lpQ5B\nbhOzbI6vywKBgGDWlg8QGYVFxhvdZlUtn8CvhtqEVzFWdexbFrnckFXu3833ucrg\nJTu9iDC2Rim1F25ZXvMPo0ziWEft6qoXdZYzhFW3XvzdPS3Dq9Doij36OtiJwImV\nMYwZJTI05Vt83siZPwJ24AQzlB4YlQOQr8M6w74PcYDhOM3Zbtzy+8LFAoGBAIis\n6WNJxssFAvoh3cnLE4DIfN2ggFlQ7hLgTlTssVKdZhpmaXfee4vgwwhIHtg3nsIA\n743bRQtI/6HFmYDVWZr59W4GW4zkqSitR4WEkcdhPPiGLgTf7vEz7siBrzT993Wj\ngu8tlTbxKCeHsMsruFoT5o4vXnDiXsMGK07EKNyjAoGBAI4zjO3O2j3T3e7nhfd3\nGQSQQHGKuaBcjkOiAZTVb3r4AUTO+lTIt60SbtEYmtw7XkxlZGrULo9QTv96N5XR\n5R+/jUZNKm0P3oac0AB29qRVj+3ZXH7M4zBD6pCHEaG3FS6aePsGm92ojhW4xeMq\nLLctiv9+QqErTPahLQj9y0DI\n-----END PRIVATE KEY-----\n",
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