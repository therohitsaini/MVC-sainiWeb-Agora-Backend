const mongoose = require('mongoose');
const shop = new mongoose.Schema({
    shop: String,
    accessToken: String,
    installedAt: { type: Date, default: Date.now }
});

const shopModel = mongoose.model('shopifyShop', shop);

module.exports = { shopModel }