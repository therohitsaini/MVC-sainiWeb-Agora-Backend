const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const verifyWebhook = (req) => {
    const hmac = req.headers["x-shopify-hmac-sha256"];
    const body = req.body;
    console.log("body", req.headers,);
    const hash = crypto
        .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
        .update(body)
        .digest("base64");
    console.log("hash", hash);

    return hash === hmac;
};

module.exports = { verifyWebhook };