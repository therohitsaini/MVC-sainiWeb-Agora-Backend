const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        // Priority 1: Check if service account credentials are provided via environment variable
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env variable");
        }
        // Priority 2: Check if serviceAccountKey.json file exists
        else {
            const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccount = require(serviceAccountPath);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
                console.log("✅ Firebase Admin initialized from serviceAccountKey.json file");
            }
            // Priority 3: Use FIREBASE_PROJECT_ID (for Google Cloud environments)
            else if (process.env.FIREBASE_PROJECT_ID) {
                admin.initializeApp({
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
                console.log("✅ Firebase Admin initialized from FIREBASE_PROJECT_ID env variable");
            } else {
                console.warn("⚠️ Firebase Admin not initialized: Missing FIREBASE_SERVICE_ACCOUNT, serviceAccountKey.json, or FIREBASE_PROJECT_ID");
            }
        }
    } catch (error) {
        console.error("❌ Error initializing Firebase Admin:", error.message);
    }
}

/**
 * Send push notification to a user's device
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the notification send
 */
async function sendPushNotification(fcmToken, notification, data = {}) {
    if (!admin.apps.length) {
        console.warn("⚠️ Firebase Admin not initialized. Skipping push notification.");
        return { success: false, error: "Firebase not initialized" };
    }

    if (!fcmToken) {
        console.warn("⚠️ No FCM token provided. Skipping push notification.");
        return { success: false, error: "No FCM token" };
    }

    const message = {
        token: fcmToken,
        notification: {
            title: notification.title || "New Notification",
            body: notification.body || "You have a new message",
            ...notification
        },
        data: {
            ...data,
            // Convert all data values to strings (FCM requirement)
            ...Object.keys(data).reduce((acc, key) => {
                acc[key] = String(data[key]);
                return acc;
            }, {})
        },
        android: {
            priority: "high",
            notification: {
                sound: "default",
                channelId: "default",
                priority: "high"
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                    badge: 1
                }
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("✅ Push notification sent successfully:", response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error("❌ Error sending push notification:", error.message);

        // Handle invalid token errors
        if (error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered") {
            console.warn("⚠️ Invalid or unregistered FCM token:", fcmToken);
            return { success: false, error: "Invalid token", shouldRemoveToken: true };
        }

        return { success: false, error: error.message };
    }
}

/**
 * Send push notification to multiple devices
 * @param {Array<string>} fcmTokens - Array of Firebase Cloud Messaging tokens
 * @param {object} notification - Notification payload
 * @param {object} data - Additional data payload (optional)
 * @returns {Promise<object>} - Result of the batch notification send
 */
async function sendPushNotificationToMultiple(fcmTokens, notification, data = {}) {
    if (!admin.apps.length) {
        console.warn("⚠️ Firebase Admin not initialized. Skipping push notification.");
        return { success: false, error: "Firebase not initialized" };
    }

    if (!fcmTokens || fcmTokens.length === 0) {
        console.warn("⚠️ No FCM tokens provided. Skipping push notification.");
        return { success: false, error: "No FCM tokens" };
    }

    const message = {
        notification: {
            title: notification.title || "New Notification",
            body: notification.body || "You have a new message",
            ...notification
        },
        data: {
            ...data,
            ...Object.keys(data).reduce((acc, key) => {
                acc[key] = String(data[key]);
                return acc;
            }, {})
        },
        android: {
            priority: "high",
            notification: {
                sound: "default",
                channelId: "default",
                priority: "high"
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                    badge: 1
                }
            }
        },
        tokens: fcmTokens
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`✅ Push notifications sent: ${response.successCount}/${fcmTokens.length} successful`);

        // Handle failed tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(fcmTokens[idx]);
                    console.warn("⚠️ Failed to send to token:", fcmTokens[idx], resp.error?.message);
                }
            });
            return {
                success: true,
                successCount: response.successCount,
                failureCount: response.failureCount,
                failedTokens
            };
        }

        return { success: true, successCount: response.successCount };
    } catch (error) {
        console.error("❌ Error sending batch push notifications:", error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification when user disconnects (for pending messages)
 * @param {string} userId - User ID who disconnected
 * @param {object} user - User document with firebaseToken
 * @param {number} pendingMessageCount - Number of pending messages
 * @returns {Promise<object>} - Result of the notification send
 */
async function sendDisconnectNotification(userId, user, pendingMessageCount = 0) {
    if (!user || !user.firebaseToken || !user.firebaseToken.token) {
        console.log("ℹ️ No FCM token found for user:", userId);
        return { success: false, error: "No FCM token" };
    }

    let notificationBody = "You went offline. ";
    if (pendingMessageCount > 0) {
        notificationBody += `You have ${pendingMessageCount} new message${pendingMessageCount > 1 ? 's' : ''} waiting for you.`;
    } else {
        notificationBody += "Check back later for updates.";
    }

    const notification = {
        title: "Connection Status",
        body: notificationBody
    };

    const data = {
        type: "DISCONNECT",
        userId: String(userId),
        pendingMessages: String(pendingMessageCount),
        timestamp: String(Date.now())
    };

    return await sendPushNotification(user.firebaseToken.token, notification, data);
}

module.exports = {
    sendPushNotification,
    sendPushNotificationToMultiple,
    sendDisconnectNotification
};

