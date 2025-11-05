const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING || 10;







const manageShopifyUser = async (shop, customerId) => {
    try {
        console.log("shop", shop, customerId);
        const shopDoc = await shopModel.findOne({ shop: shop });
        if (!shopDoc) {
            console.log("shopDoc not found");
            return null;
        }
        const accessToken = shopDoc.accessToken;
        console.log("accessToken", accessToken);
        // const customer = await axios.get(`https://${shop}/admin/api/2024-07/customers/${customerId}.json`, {
        //     headers: { "X-Shopify-Access-Token": accessToken }
        // });

    } catch (error) {
        console.log("error", error);
        return null;
    }
}

module.exports = {
    manageShopifyUser
}
