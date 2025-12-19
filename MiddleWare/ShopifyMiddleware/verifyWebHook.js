const crypto = require('crypto');

const dotenv = require("dotenv");
dotenv.config();
function verifyWebhook(req, res, next) {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256'); // or lowercase
    const secret = process.env.SHOPIFY_API_SECRET;
    console.log("hmacHeader", hmacHeader);
    console.log("secret", secret);

    // req.body here is still a Buffer, do NOT JSON.stringify
    const hash = crypto
        .createHmac('sha256', secret)
        .update(req.body) // must be buffer or string
        .digest('base64');

    if (hash === hmacHeader) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

module.exports = { verifyWebhook };
