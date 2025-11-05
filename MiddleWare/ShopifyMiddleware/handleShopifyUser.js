const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING || 10;



const getCustomerDetails = async (shop, accessToken, customerId) => {
    try {
        // Convert numeric ID → Shopify GID format if needed
        const gid = String(customerId).startsWith("gid://")
            ? customerId
            : `gid://shopify/Customer/${customerId}`;

        // Define GraphQL query
        const query = `
        query {
          customer(id: "${gid}") {
            id
            firstName
            lastName
            email
            phone
            createdAt
            verifiedEmail
            numberOfOrders
            amountSpent {
              amount
              currencyCode
            }
            defaultAddress {
              address1
              city
              country
            }
          }
        }
      `;

        // Make API call
        const response = await axios.post(
            `https://${shop}/admin/api/2024-10/graphql.json`,
            { query },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );
        console.log("response", response);

        // Handle response
        if (response.data.errors) {
            console.error("GraphQL Errors:", response.data.errors);
            return null;
        }

        const customer = response.data?.data?.customer;
        console.log("✅ Customer Details:", customer);
        return customer;
    } catch (error) {
        console.error("❌ Error fetching customer:", error.response?.data || error.message);
        return null;
    }
};




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
        const customer = await getCustomerDetails(shop, accessToken, customerId);
        console.log("customer", customer);
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
