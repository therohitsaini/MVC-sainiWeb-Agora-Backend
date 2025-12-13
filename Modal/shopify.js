const mongoose = require('mongoose');
const shop = new mongoose.Schema({
    shop: String,
    accessToken: String,
    shopId: String,
    email: String,
    adminPersenTage: { type: Number, default: 0 },
    installedAt: { type: Date, default: Date.now }
});

// Model already exists check karo - duplicate model name se bachne ke liye
const shopModel = mongoose.models.shopifyShop || mongoose.model('shopifyShop', shop);

module.exports = { shopModel }