const { User } = require("../Modal/userSchema");

async function handleUserDisconnect(userId) {
    const user = await User.findById(userId);

    if (!user || !user.firebaseToken?.token) {
        console.log("No token found for user:", userId);
        return;
    }

    const token = user.firebaseToken.token;
    console.log("Token found for user:", token);

    // await sendPushNotification(token, {
    //     title: "User Offline",
    //     body: "A user has gone offline!",
    // });
}

module.exports = { handleUserDisconnect };