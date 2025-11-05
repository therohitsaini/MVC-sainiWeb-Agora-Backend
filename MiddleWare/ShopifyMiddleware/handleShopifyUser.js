const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING || 10;

// Shopify Admin API SDK (optional; falls back to axios if not installed)
let shopifyApi, ApiVersion, Session;
try {
    ({ shopifyApi, ApiVersion, Session } = require('@shopify/shopify-api'));
} catch (_) {
    // SDK not installed; axios path will be used
}

// Prefer official SDK when available
async function fetchCustomerWithSdk(shop, customerId) {
    try {
        if (!shopifyApi || !ApiVersion || !Session) return null;

        const shopDoc = await shopModel.findOne({ shop })
            || await shopModel.findOne({ shop: shop.replace('.myshopify.com', '') })
            || await shopModel.findOne({ shop: `${shop}.myshopify.com` });
        if (!shopDoc?.accessToken) return null;

        const shopify = shopifyApi({
            apiKey: process.env.SHOPIFY_API_KEY || "9670f701d5332dc0e886440fd2277221",
            apiSecretKey: process.env.SHOPIFY_API_SECRET || "c29681750a54ed6a6f8f3a7d1eaa5f14",
            apiVersion: ApiVersion.July24,
            isCustomStoreApp: true,
        });

        const session = new Session({
            id: `offline_${shop}`,
            shop,
            state: 'state',
            isOnline: false,
            accessToken: shopDoc.accessToken,
        });

        const client = new shopify.clients.Graphql({ session });
        const gid = String(customerId).startsWith('gid://') ? String(customerId) : `gid://shopify/Customer/${customerId}`;
        const query = `
            query { customer(id: "${gid}") {
              id email firstName lastName phone createdAt
              defaultAddress { address1 city province country zip }
              addresses { address1 city province country zip }
            } }
        `;
        const resp = await client.query({ data: query });
        return resp?.body?.data?.customer || null;
    } catch (e) {
        console.error('❌ SDK GraphQL error:', e?.message || e);
        return null;
    }
}

// Helper function for REST API fallback



const getCustomerDetail = async (shop, customerId) => {
    try {
        console.log("🔍 Fetching customer detail for:", { shop, customerId });

        // Normalize and find shop document
        let shopDoc =
            (await shopModel.findOne({ shop })) ||
            (await shopModel.findOne({ shop: shop.replace(".myshopify.com", "") })) ||
            (await shopModel.findOne({ shop: `${shop}.myshopify.com` }));

        // shop doc found
        if (!shopDoc || !shopDoc.accessToken) {
            console.error("❌ Shop not found or missing access token in DB");
            return null;
        }

        const accessToken = shopDoc.accessToken;
        const gid = String(customerId).startsWith("gid://")
            ? String(customerId)
            : `gid://shopify/Customer/${customerId}`;

        // gid prepared
        // 0) Try official SDK first
        const sdkCustomer = await fetchCustomerWithSdk(shop, customerId);
        if (sdkCustomer) {
            console.log('✅ Customer via SDK');
            return sdkCustomer;
        }

        // 1) Fallback to raw GraphQL via axios (only safe fields)
        const query = `
        query { customer(id: "${gid}") {
          id email firstName lastName phone createdAt updatedAt verifiedEmail
          addresses { address1 city province country zip }
          defaultAddress { address1 city country zip }
        } }
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
                validateStatus: () => true, // Don't throw on any status
            }
        );

        console.log("📊 GraphQL status:", response.status);

        // Check for GraphQL errors
        if (response.data?.errors && response.data.errors.length > 0) {
            console.error("❌ GraphQL Errors:", response.data.errors);
            return await tryRestApiFallback(shop, customerId, accessToken);
        }

        // Validate structure
        if (!response.data?.data) {
            console.error("❌ No data in GraphQL response");
            return await tryRestApiFallback(shop, customerId, accessToken);
        }

        const customer = response.data?.data?.customer;
        if (!customer) {
            console.error("❌ Customer is null - trying REST API fallback");
            return await tryRestApiFallback(shop, customerId, accessToken);
        }

        console.log('✅ Customer via axios GraphQL');
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

        // Fetch customer data from Shopify via GraphQL
        const customer = await getCustomerDetail(shop, customerId);
        console.log("📦 Customer data from Shopify:", customer);

        // If we couldn't fetch customer data due to missing scope, create minimal user record
        if (!customer) {
            console.warn('⚠️ Cannot fetch customer data - missing read_customers scope');
            console.warn('💡 Creating minimal user record with customerId only');

            // Check if user already exists by shopifyCustomerId
            const existingUserByShopifyId = await User.findOne({ shopifyCustomerId: customerId.toString() });
            if (existingUserByShopifyId) {
                console.log('ℹ️ User already exists with Shopify ID:', customerId);
                return { success: true, message: 'User already exists', userId: existingUserByShopifyId._id };
            }

            // Create minimal user record
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const rounding = roundingNumber ? parseInt(roundingNumber) : 10;
            const hashedPassword = await bcrypt.hash(randomPassword, rounding);

            // Generate temporary email based on customerId
            const tempEmail = `shopify_customer_${customerId}@temp.shopify.local`;

            const newUser = new User({
                fullname: `Shopify Customer ${customerId}`,
                email: tempEmail,
                password: hashedPassword,
                role: 'user',
                isActive: true,
                userType: 'shopify_customer',
                walletBalance: 0,
                shopifyCustomerId: customerId.toString(),
            });

            await newUser.save();
            console.log('✅ Minimal customer record saved to database:', {
                id: newUser._id,
                shopifyCustomerId: newUser.shopifyCustomerId
            });

            return {
                success: true,
                message: 'Minimal user record created',
                userId: newUser._id,
                shopifyCustomerId: newUser.shopifyCustomerId
            };
        }

        // Extract customer data (when we have full data)
        const email = (customer.email || '').toLowerCase();
        const firstName = customer.firstName || '';
        const lastName = customer.lastName || '';
        const fullname = `${firstName} ${lastName}`.trim() || (email.split('@')[0] || 'Customer');
        const phone = customer.phone || undefined;
        const address = customer.defaultAddress || customer.addresses?.[0];
        const addressString = address ?
            `${address.address1 || ''}, ${address.city || ''}, ${address.province || ''} ${address.zip || ''}`.trim() :
            '';

        // Check if user already exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('ℹ️ User already exists:', email);
            return { success: true, message: 'User already exists', userId: existingUser._id };
        }

        // Also check by shopifyCustomerId
        const shopifyCustomerId = customer.id?.toString().replace('gid://shopify/Customer/', '') || customerId?.toString();
        const existingUserByShopifyId = await User.findOne({ shopifyCustomerId: shopifyCustomerId });
        if (existingUserByShopifyId) {
            console.log('ℹ️ User already exists with Shopify ID:', shopifyCustomerId);
            // Update existing user with full data
            existingUserByShopifyId.email = email;
            existingUserByShopifyId.fullname = fullname;
            if (phone) existingUserByShopifyId.phone = phone;
            if (addressString) existingUserByShopifyId.address = addressString;
            if (address?.city) existingUserByShopifyId.city = address.city;
            if (address?.province) existingUserByShopifyId.state = address.province;
            if (address?.zip) existingUserByShopifyId.zip = address.zip;
            if (address?.country) existingUserByShopifyId.country = address.country;
            await existingUserByShopifyId.save();
            console.log('✅ Updated existing user with full customer data');
            return { success: true, message: 'User updated with full data', userId: existingUserByShopifyId._id };
        }

        // Generate random password (Shopify customers don't have passwords)
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const rounding = roundingNumber ? parseInt(roundingNumber) : 10;
        const hashedPassword = await bcrypt.hash(randomPassword, rounding);

        // Create new user in database
        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
            phone,
            address: addressString || undefined,
            city: address?.city || undefined,
            state: address?.province || address?.state || undefined,
            zip: address?.zip || undefined,
            country: address?.country || undefined,
            role: 'user',
            isActive: true,
            userType: 'shopify_customer',
            walletBalance: 0,
            shopifyCustomerId: shopifyCustomerId,
        });

        await newUser.save();
        console.log('✅ Customer saved to database:', {
            id: newUser._id,
            email: newUser.email,
            fullname: newUser.fullname,
            shopifyCustomerId: newUser.shopifyCustomerId
        });

        return {
            success: true,
            message: 'Customer saved successfully',
            userId: newUser._id,
            email: newUser.email
        };

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
