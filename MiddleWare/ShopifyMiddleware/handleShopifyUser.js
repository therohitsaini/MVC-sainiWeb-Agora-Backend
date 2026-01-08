const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");





const manageShopifyUser = async (shop, customerId) => {
    try {
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

        if (response.data.data.customer) {
            const customer = response.data.data.customer;
            const id = customer.id.split('/').pop();
            console.log("id", id);
            const user = await User.findOne({ shopifyCustomerId: id });
            const getShop = await shopModel.findOne({ shop: shop });

            if (user) {
                return { success: true, message: "Customer already exists", userId: user._id };
            } else {
                // Combine firstName and lastName for fullname, handle null/undefined
                const fullname = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Shopify Customer';

                const newUser = new User({
                    shopifyCustomerId: id,
                    shop_id: getShop._id,
                    userType: "customer",
                     walletBalance: 100,
                   email: customer.email,
                    fullname: fullname,
                    isChatAccepted: "request",
                    createdAt: customer.createdAt,
                    numberOfOrders: customer.numberOfOrders
                });
                console.log("newUser    ", newUser);
                await newUser.save();

                return { success: true, message: "Customer created successfully", shop_id: newUser.shop_id, userId: newUser._id };
            }
        }
        return { success: false, message: "Customer not found in Shopify" };

    } catch (error) {
        console.error("Error fetching customer:", error.response?.data || error.message);
        return { success: false, message: error.message || "Error registering customer", error: error.response?.data || error.message };
    }
}

module.exports = {
    manageShopifyUser
}
