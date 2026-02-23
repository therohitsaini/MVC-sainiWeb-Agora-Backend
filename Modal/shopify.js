const mongoose = require('mongoose');
const shop = new mongoose.Schema({
    shop: String,
    accessToken: String,
    shopId: String,
    email: String,

    adminPersenTage: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0")
    },

    adminWalletBalance: {
        type: mongoose.Schema.Types.Decimal128,
        default: mongoose.Types.Decimal128.fromString("0")
    },
    appEnabled: {
        type: Boolean,
        default: false
    },
    vouchers: [
        {
            voucherCode: String,
            totalCoin: Number,
            extraCoin: Number,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        }
    ],
    accountPlanInfo: [{
        planName: String,
        planType: String,
        planAmount: String
    }
    ],
    chargeId: {
        type: String,
        default: ""
    },
    planStatus: {
        type: String,
        default: ""
    },
    installedAt: { type: Date, default: Date.now }
});

const shopModel = mongoose.models.shopifyShop || mongoose.model('shopifyShop', shop);

module.exports = { shopModel }