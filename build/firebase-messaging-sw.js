// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

// Replace these with same config as src/firebase.js
firebase.initializeApp({
    apiKey: "AIzaSyCi61pDIUtbi7pvnxfFRNIpi8RjTHpFNxs",
    authDomain: "consultant-app-24ceb.firebaseapp.com",
    projectId: "consultant-app-24ceb",
    storageBucket: "consultant-app-24ceb.firebasestorage.app",
    messagingSenderId: "465295888006",
    appId: "1:465295888006:web:ae07e6f6667e0e6f838b07",
    measurementId: "G-9TD9Q1Q0PJ"
});

// const defaultBadge = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Notification_badge_icon.png';

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage(function (payload) {
//     const title = payload.notification?.title || "New message";

//     const options = {
//         body: payload.notification?.body || "",
//         icon: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&auto=format',
//         badge: defaultBadge,
//         image: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=200&h=100', // Large image
//         vibrate: [200, 100, 200],
//         // actions: [
//         //     { action: 'reply', title: 'Reply', icon: 'https://img.icons8.com/ios/50/000000/reply-all.png' },
//         //     { action: 'view', title: 'View', icon: 'https://img.icons8.com/ios/50/000000/visible.png' }
//         // ],
//         data: payload.data
//     };

//     self.registration.showNotification(title, options);
// });
const defaultBadge = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Notification_badge_icon.png';
const messaging = firebase.messaging();

// Make rounded image + return BASE64
async function makeRoundedImageBase64(url, size = 128) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        const canvas = new OffscreenCanvas(size, size);
        const ctx = canvas.getContext("2d");

        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(bitmap, 0, 0, size, size);

        const finalBlob = await canvas.convertToBlob({ type: "image/png" });

        // Convert blob → base64
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // base64
            reader.readAsDataURL(finalBlob);
        });

    } catch (err) {
        console.error("Rounded failed:", err);
        return url; // fallback
    }
}

messaging.onBackgroundMessage(async function (payload) {
    const title = payload.notification?.title || "New message";
    const body = payload.data?.body || "No text";

    const avatarUrl =
        payload.data?.avatar ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128";

    // Round image & convert to BASE64
    const roundedBase64 = await makeRoundedImageBase64(avatarUrl, 128);

    const options = {
        body: body,
        icon: roundedBase64, 
        badge: defaultBadge,
        data: payload.data
    };

    self.registration.showNotification(title, options);
});


