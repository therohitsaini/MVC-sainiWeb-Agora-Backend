const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING || 10;

// // Helper function for REST API fallback
// const tryRestApiFallback = async (shop, customerId, accessToken) => {
//     try {
//         const restUrl = `https://${shop}/admin/api/2024-07/customers/${customerId}.json`;
//         console.log('🌐 Trying REST API fallback:', restUrl);
//         const restRes = await axios.get(
//             restUrl,
//             {
//                 headers: {
//                     "X-Shopify-Access-Token": accessToken,
//                 },
//                 validateStatus: () => true,
//             }
//         );

//         console.log('📊 REST API Response Status:', restRes.status);
//         console.log('📊 REST API Response Data:', JSON.stringify(restRes.data, null, 2));

//         if (restRes.status === 200 && restRes.data?.customer) {
//             const c = restRes.data.customer;
//             console.log('✅ Got customer data via REST API');
//             return {
//                 id: `gid://shopify/Customer/${c.id}`,
//                 email: c.email,
//                 firstName: c.first_name,
//                 lastName: c.last_name,
//                 phone: c.phone,
//                 createdAt: c.created_at,
//                 verifiedEmail: c.verified_email,
//             };
//         } else {
//             console.error('❌ REST API also failed:', restRes.status);
//             if (restRes.data?.errors) {
//                 console.error('Error details:', restRes.data.errors);
//             }
//             return null;
//         }
//     } catch (restError) {
//         console.error('❌ REST API error:', restError.message);
//         return null;
//     }
// };

// const getCustomerDetail = async (shop, customerId) => {
//     try {
//         console.log("🔍 Fetching customer detail for:", { shop, customerId });

//         // Normalize shop name - try both with and without .myshopify.com
//         let shopDoc = await shopModel.findOne({ shop: shop });
//         if (!shopDoc) {
//             // Try without .myshopify.com
//             const shopWithoutDomain = shop.replace('.myshopify.com', '');
//             shopDoc = await shopModel.findOne({ shop: shopWithoutDomain });
//         }
//         if (!shopDoc) {
//             // Try with .myshopify.com added
//             const shopWithDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
//             shopDoc = await shopModel.findOne({ shop: shopWithDomain });
//         }

//         if (!shopDoc || !shopDoc.accessToken) {
//             console.error('❌ Shop not found or access token missing');
//             console.error('Searched for shop:', shop);
//             console.error('Available shops in DB:', await shopModel.find({}, { shop: 1, _id: 0 }));
//             return null;
//         }

//         console.log('✅ Found shop in DB:', shopDoc.shop);
//         console.log('🔑 Access token exists:', shopDoc.accessToken ? 'Yes (first 10 chars: ' + shopDoc.accessToken.substring(0, 10) + '...)' : 'No');

//         const gid = String(customerId).startsWith('gid://')
//             ? String(customerId)
//             : `gid://shopify/Customer/${customerId}`;

//         // Try GraphQL first
//         const query = `
//             query {
//                 customer(id: "${gid}") {
//                     id
//                     email
//                     firstName
//                     lastName
//                     phone
//                     createdAt
//                     verifiedEmail
//                 }
//             }
//         `;

//         const graphqlUrl = `https://${shop}/admin/api/2024-07/graphql.json`;
//         console.log('🌐 Trying GraphQL:', graphqlUrl);

//         const res = await axios.post(
//             graphqlUrl,
//             { query },
//             {
//                 headers: {
//                     "X-Shopify-Access-Token": shopDoc.accessToken,
//                     "Content-Type": "application/json",
//                 },
//                 validateStatus: () => true,
//             }
//         );

//         if (res.status === 401) {
//             console.error('❌ GraphQL 401 Unauthorized - Access token is invalid or expired');
//             console.error('💡 SOLUTION: Reinstall the app to get a new access token');
//             console.error('   - Visit: /apps/install?shop=' + shop);
//             console.error('   - Or update the token in database for shop:', shop);

//             // Fallback to REST API
//             const restResult = await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
//             if (!restResult) {
//                 console.error('');
//                 console.error('═══════════════════════════════════════════════════════');
//                 console.error('⚠️  ACCESS TOKEN IS INVALID OR EXPIRED');
//                 console.error('═══════════════════════════════════════════════════════');
//                 console.error('To fix this:');
//                 console.error('1. Reinstall the app: /apps/install?shop=' + shop);
//                 console.error('2. Or update the accessToken in MongoDB for shop:', shop);
//                 console.error('   Current token starts with:', shopDoc.accessToken.substring(0, 15));
//                 console.error('═══════════════════════════════════════════════════════');
//             }
//             return restResult;
//         }

//         // Log GraphQL response for debugging
//         console.log('📊 GraphQL Response Status:', res.status);
//         console.log('📊 GraphQL Response Data:', JSON.stringify(res.data, null, 2));

//         if (res.status >= 400) {
//             console.error('❌ GraphQL error status:', res.status, res.data);
//             // Try REST API fallback
//             return await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
//         }

//         // Check for GraphQL errors in response
//         if (res.data?.errors) {
//             console.error('❌ GraphQL errors in response:', res.data.errors);
//             // Try REST API fallback
//             return await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
//         }

//         const customer = res.data?.data?.customer;
//         if (customer) {
//             console.log('✅ Got customer data via GraphQL:', { email: customer.email, id: customer.id });
//         } else {
//             console.error('❌ GraphQL returned null customer - trying REST API fallback');
//             // Try REST API fallback
//             return await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
//         }
//         return customer || null;
//     } catch (error) {
//         console.error('❌ Error fetching customer detail:', error.message);
//         if (error.response) {
//             console.error('Response status:', error.response.status);
//             console.error('Response data:', error.response.data);
//         }
//         return null;
//     }
// }

const getCustomerDetail = async (shop, customerId) => {
    try {
        console.log("🔍 Fetching customer detail for:", { shop, customerId });

        // Normalize and find shop document
        let shopDoc =
            (await shopModel.findOne({ shop })) ||
            (await shopModel.findOne({ shop: shop.replace(".myshopify.com", "") })) ||
            (await shopModel.findOne({ shop: `${shop}.myshopify.com` }));

        console.log("shopDoc", shopDoc);
        if (!shopDoc || !shopDoc.accessToken) {
            console.error("❌ Shop not found or missing access token in DB");
            return null;
        }

        const accessToken = shopDoc.accessToken;
        console.log("accessToken", accessToken);
        const gid = String(customerId).startsWith("gid://")
            ? String(customerId)
            : `gid://shopify/Customer/${customerId}`;

        console.log("gid", gid);
        // 🧠 GraphQL query
        const query = `
        query {
          customer(id: "${gid}") {
            id
            email
            firstName
            lastName
            phone
            createdAt
            updatedAt
            verifiedEmail
            ordersCount
            totalSpent
            state
            tags
            addresses {
              address1
              city
              province
              country
              zip
            }
            defaultAddress {
              address1
              city
              country
              zip
            }
            lastOrder {
              id
              name
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `;

        const graphqlUrl = `https://${shop}/admin/api/2024-07/graphql.json`;

        const response = await axios.post(
            graphqlUrl,
            { query },
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data.errors) {
            console.error("❌ GraphQL Errors:", response.data.errors);
            return null;
        }

        const customer = response.data.data.customer;

        if (!customer) {
            console.error("❌ Customer not found or invalid ID");
            return null;
        }

        console.log("✅ Customer data fetched successfully:");
        console.log("--------------------------------------------------");
        console.log(JSON.stringify(customer, null, 2));
        console.log("--------------------------------------------------");

        return customer;

    } catch (error) {
        console.error("❌ Error fetching customer detail:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        }
        return null;
    }
};

const manageShopifyUser = async (shop, customerId) => {
    console.log("🔍 Managing Shopify user:", { shop, customerId });
    try {
        // Validate inputs
        if (!shop || !customerId) {
            console.error('Missing shop or customerId:', { shop, customerId });
            return { success: false, message: 'Shop and customerId are required' };
        }

        const customer = await getCustomerDetail(shop, customerId);
        console.log(" Customer data from Shopify:", customer);

    } catch (err) {
        if (err?.code === 11000) {
            // Duplicate key error (email already exists)
            console.log('⚠️ Duplicate key on save - user already exists');
            return { success: true, message: 'User already exists' };
        }
        console.error("❌ Error in manageShopifyUser:", err?.message || err);
        return { success: false, message: err?.message || 'Failed to register user' };
    }
}

module.exports = {
    manageShopifyUser
}
