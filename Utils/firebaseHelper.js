const { User } = require("../Modal/userSchema");
const { sendPushNotification } = require("./sendNotification");

async function handleUserDisconnect(userId) {
    const user = await User.findById(userId);

    if (!user || !user.firebaseToken?.token) {
        console.log("No token found for user:", userId);
        return;
    }

    const token = user.firebaseToken.token;
    

    await sendPushNotification(token, {
        title: "User Offline",
        body: "A user has gone offline!",
    });
}

module.exports = { handleUserDisconnect };