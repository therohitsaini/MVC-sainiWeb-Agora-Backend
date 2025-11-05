const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING || 10;



// const getCustomerDetails = async (shop, accessToken, customerId) => {
//     try {
//         // Convert numeric ID → Shopify GID format if needed
//         const gid = String(customerId).startsWith("gid://")
//             ? customerId
//             : `gid://shopify/Customer/${customerId}`;

//         // Define GraphQL query
//         const query = `
//        query {
//   customer(id: "gid://shopify/Customer/544365967") {
//     id
//     firstName
//     lastName
//     email
//     phone
//     numberOfOrders
//     amountSpent {
//       amount
//       currencyCode
//     }
//     createdAt
//     updatedAt
//     note
//     verifiedEmail
//     validEmailAddress
//     tags
//     lifetimeDuration
//     defaultAddress {
//       formattedArea
//       address1
//     }
//     addresses {
//       address1
//     }
//     image {
//       src
//     }
//     canDelete
//   }
// }
//       `;

//         // Make API call
//         const response = await axios.post(
//             `https://${shop}/admin/api/2024-10/graphql.json`,
//             { query },
//             {
//                 headers: {
//                     "X-Shopify-Access-Token": accessToken,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );
//         console.log("response", response);

//         // Handle response
//         if (response.data.errors) {
//             console.error("GraphQL Errors:", response.data.errors);
//             return null;
//         }

//         const customer = response.data?.data?.customer;
//         console.log("✅ Customer Details:", customer);
//         return customer;
//     } catch (error) {
//         console.error("❌ Error fetching customer:", error.response?.data || error.message);
//         return null;
//     }
// };




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
                phone
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

        console.log("✅ Customer Data:", response.data);
        res.json(response.data);
        // const customer = await axios.get(`https://${shop}/admin/api/2024-07/customers/${customerId}.json`, {
        //     headers: { "X-Shopify-Access-Token": accessToken }
        // });

    } catch (err) {
        console.error("❌ Error fetching customer:", err.response?.data || err.message);
        res.status(500).json({ error: err.response?.data || err.message });
    }
}

module.exports = {
    manageShopifyUser
}
