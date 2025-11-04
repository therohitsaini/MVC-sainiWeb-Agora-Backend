/**
 * user resgitertion controller 
 * for registertaion use shopify signup page proxy
 * 
 */
const mongoose = require("mongoose");
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
dotenv.config();

const { shopModel } = require("../../Modal/shopify");
const { User } = require("../../Modal/userSchema");
const axios = require("axios");
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING || 10;

const getCustomerDetail = async (shop, customerId) => {
    try {
        console.log("🔍 Fetching customer detail for:", { shop, customerId });
        const shopDoc = await shopModel.findOne({ shop: shop });
        if (!shopDoc || !shopDoc.accessToken) {
            console.error('Shop not found or access token missing for', shop);
            return null;
        }

        const gid = String(customerId).startsWith('gid://')
            ? String(customerId)
            : `gid://shopify/Customer/${customerId}`;

        const query = `
            query {
                customer(id: "${gid}") {
                    id
                    email
                    firstName
                    lastName
                    phone
                    createdAt
                    verifiedEmail
                }
            }
        `;

        const res = await axios.post(
            `https://${shop}/admin/api/2024-07/graphql.json`,
            { query },
            {
                headers: {
                    "X-Shopify-Access-Token": shopDoc.accessToken,
                    "Content-Type": "application/json",
                },
                validateStatus: () => true,
            }
        );

        if (res.status === 401) {
            console.error('GraphQL 401 Unauthorized for shop', shop);
            return null;
        }
        if (res.status >= 400) {
            console.error('GraphQL error status:', res.status, res.data);
            return null;
        }
        return res.data?.data?.customer || null;
    } catch (error) {
        console.error('Error fetching customer detail:', error.message);
        return null;
    }
}

const manageShopifyUser = async (shop, customerId) => {
    try {
        // Validate inputs
        if (!shop || !customerId) {
            console.error('Missing shop or customerId:', { shop, customerId });
            return { success: false, message: 'Shop and customerId are required' };
        }

        // Fetch customer data from Shopify via GraphQL
        const customer = await getCustomerDetail(shop, customerId);
        console.log("📦 Customer data from Shopify:", customer);
        
        if (!customer) {
            console.error('❌ Failed to fetch customer data from Shopify:', { shop, customerId });
            return { success: false, message: 'Failed to fetch customer data from Shopify' };
        }

        // Extract customer data
        const email = (customer.email || '').toLowerCase();
        const firstName = customer.firstName || '';
        const lastName = customer.lastName || '';
        const fullname = `${firstName} ${lastName}`.trim() || (email.split('@')[0] || 'Customer');
        const phone = customer.phone || undefined;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('ℹ️ User already exists:', email);
            return { success: true, message: 'User already exists', userId: existingUser._id };
        }

        // Generate random password (Shopify customers don't have passwords)
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const rounding = roundingNumber ? parseInt(roundingNumber) : 10;
        const hashedPassword = await bcrypt.hash(randomPassword, rounding);

        // Extract customer ID from Shopify GID format
        const shopifyCustomerId = customer.id?.toString().replace('gid://shopify/Customer/', '') || customerId?.toString();

        // Create new user in database
        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
            phone,
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
