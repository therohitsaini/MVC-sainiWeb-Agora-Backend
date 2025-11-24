const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const { ShopfiyUsers } = require("../../Modal/shopfiyUsers");





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

        const graphqlQuery = {
            query: `{
              customer(id: "gid://shopify/Customer/${customerId}") {
                id
                firstName
                lastName
                email
                createdAt
                numberOfOrders
              }
            }`,
        };
        const headers = {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
        };
        const url = `https://${shop}/admin/api/2024-10/graphql.json`;
        const response = await axios.post(url, graphqlQuery, { headers });
        console.log("response", response.data.data.customer);
        if (response.data.data.customer) {
            const customer = response.data.data.customer;
            const id = customer.id.split('/').pop();
            console.log("id", id);
            const user = await User.findOne({ shopifyCustomerId: id });
            console.log("user", user);
            if (user) {
                return { success: true, message: "Customer already exists", userId: user._id };
            } else {
                const newUser = new User({
                    shopifyCustomerId: id,
                    shop_id: "690c374f605cb8b946503ccb",
                    userType: "customer",
                    email: customer.email,
                    fullname: customer.firstName,
                    walletBalance: 100,
                    createdAt: customer.createdAt,
                    numberOfOrders: customer.numberOfOrders
                });
                await newUser.save();
                return { success: true, message: "Customer created successfully", userId: newUser._id };
            }
        }

    } catch (error) {
        console.error("Error fetching customer:", error.response?.data || error.message);

    }
}

module.exports = {
    manageShopifyUser
}
