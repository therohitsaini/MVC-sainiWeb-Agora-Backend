const mongoose = require("mongoose");

const shopfiyUsersSchema = new mongoose.Schema({
    shopifyCustomerId: {
     type: String,
        required: true,
    },
    shop_id: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    fullname: {
        type: String,
        required: true,
    },
    walletBalance: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
    updatedAt: {
        type: Date,
        required: true,
    },

});

const ShopfiyUsers = mongoose.model("ragisterUser", shopfiyUsersSchema);

module.exports = { ShopfiyUsers };