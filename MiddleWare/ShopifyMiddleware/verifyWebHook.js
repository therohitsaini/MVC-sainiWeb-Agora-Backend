const crypto = require('crypto');

function verifyWebhook(req, res, next) {
    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    const secret = process.env.SHOPIFY_API_SECRET;

    console.log('--- WEBHOOK DEBUG ---');
    console.log('Has HMAC:', !!hmacHeader);
    console.log('Has Secret:', !!secret);
    console.log('Is Buffer:', Buffer.isBuffer(req.body));
    console.log('Body length:', req.body?.length);

    if (!hmacHeader || !secret || !Buffer.isBuffer(req.body)) {
        return res.status(401).send('Invalid webhook');
    }

    const generatedHash = crypto
        .createHmac('sha256', secret)
        .update(req.body)
        .digest('base64');

    console.log('Shopify HMAC:', hmacHeader);
    console.log('Generated HMAC:', generatedHash);

    if (generatedHash !== hmacHeader) {
        return res.status(401).send('HMAC mismatch');
    }

    next(); // ✅ VERIFIED
}

module.exports = { verifyWebhook };
