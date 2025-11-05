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

// Helper function for REST API fallback
const tryRestApiFallback = async (shop, customerId, accessToken) => {
    try {
        const restUrl = `https://${shop}/admin/api/2024-07/customers/${customerId}.json`;
        console.log('🌐 Trying REST API fallback:', restUrl);
        const restRes = await axios.get(
            restUrl,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken,
                },
                validateStatus: () => true,
            }
        );

        console.log('📊 REST API Response Status:', restRes.status);
        console.log('📊 REST API Response Data:', JSON.stringify(restRes.data, null, 2));

        if (restRes.status === 200 && restRes.data?.customer) {
            const c = restRes.data.customer;
            console.log('✅ Got customer data via REST API');
            return {
                id: `gid://shopify/Customer/${c.id}`,
                email: c.email,
                firstName: c.first_name,
                lastName: c.last_name,
                phone: c.phone,
                createdAt: c.created_at,
                verifiedEmail: c.verified_email,
            };
        } else {
            console.error('❌ REST API also failed:', restRes.status);
            if (restRes.data?.errors) {
                console.error('Error details:', restRes.data.errors);
            }
            return null;
        }
    } catch (restError) {
        console.error('❌ REST API error:', restError.message);
        return null;
    }
};

const getCustomerDetail = async (shop, customerId) => {
    try {
        console.log("🔍 Fetching customer detail for:", { shop, customerId });
        
        // Normalize shop name - try both with and without .myshopify.com
        let shopDoc = await shopModel.findOne({ shop: shop });
        if (!shopDoc) {
            // Try without .myshopify.com
            const shopWithoutDomain = shop.replace('.myshopify.com', '');
            shopDoc = await shopModel.findOne({ shop: shopWithoutDomain });
        }
        if (!shopDoc) {
            // Try with .myshopify.com added
            const shopWithDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
            shopDoc = await shopModel.findOne({ shop: shopWithDomain });
        }
        
        if (!shopDoc || !shopDoc.accessToken) {
            console.error('❌ Shop not found or access token missing');
            console.error('Searched for shop:', shop);
            console.error('Available shops in DB:', await shopModel.find({}, { shop: 1, _id: 0 }));
            return null;
        }

        console.log('✅ Found shop in DB:', shopDoc.shop);
        console.log('🔑 Access token exists:', shopDoc.accessToken ? 'Yes (first 10 chars: ' + shopDoc.accessToken.substring(0, 10) + '...)' : 'No');

        const gid = String(customerId).startsWith('gid://')
            ? String(customerId)
            : `gid://shopify/Customer/${customerId}`;

        // Try GraphQL first
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

        const graphqlUrl = `https://${shop}/admin/api/2024-07/graphql.json`;
        console.log('🌐 Trying GraphQL:', graphqlUrl);

        const res = await axios.post(
            graphqlUrl,
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
            console.error('❌ GraphQL 401 Unauthorized - Access token is invalid or expired');
            console.error('💡 SOLUTION: Reinstall the app to get a new access token');
            console.error('   - Visit: /apps/install?shop=' + shop);
            console.error('   - Or update the token in database for shop:', shop);
            
            // Fallback to REST API
            const restResult = await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
            if (!restResult) {
                console.error('');
                console.error('═══════════════════════════════════════════════════════');
                console.error('⚠️  ACCESS TOKEN IS INVALID OR EXPIRED');
                console.error('═══════════════════════════════════════════════════════');
                console.error('To fix this:');
                console.error('1. Reinstall the app: /apps/install?shop=' + shop);
                console.error('2. Or update the accessToken in MongoDB for shop:', shop);
                console.error('   Current token starts with:', shopDoc.accessToken.substring(0, 15));
                console.error('═══════════════════════════════════════════════════════');
            }
            return restResult;
        }
        
        // Log GraphQL response for debugging
        console.log('📊 GraphQL Response Status:', res.status);
        console.log('📊 GraphQL Response Data:', JSON.stringify(res.data, null, 2));
        
        if (res.status >= 400) {
            console.error('❌ GraphQL error status:', res.status, res.data);
            // Try REST API fallback
            return await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
        }
        
        // Check for GraphQL errors in response
        if (res.data?.errors) {
            console.error('❌ GraphQL errors in response:', res.data.errors);
            // Try REST API fallback
            return await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
        }
        
        const customer = res.data?.data?.customer;
        if (customer) {
            console.log('✅ Got customer data via GraphQL:', { email: customer.email, id: customer.id });
        } else {
            console.error('❌ GraphQL returned null customer - trying REST API fallback');
            // Try REST API fallback
            return await tryRestApiFallback(shop, customerId, shopDoc.accessToken);
        }
        return customer || null;
    } catch (error) {
        console.error('❌ Error fetching customer detail:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

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

            // Create minimal user record without email (will need to be updated later)
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
            console.log('✅ Minimal customer record saved to database (will need scope fix to get full data):', { 
                id: newUser._id, 
                shopifyCustomerId: newUser.shopifyCustomerId,
                note: 'Email is temporary - update after adding read_customers scope'
            });

            return { 
                success: true, 
                message: 'Minimal user record created (missing read_customers scope)', 
                userId: newUser._id,
                shopifyCustomerId: newUser.shopifyCustomerId,
                warning: 'Full customer data not available - app needs read_customers scope'
            };
        }

        // Extract customer data (when we have full data)
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
        
        // Also check by shopifyCustomerId
        const existingUserByShopifyId = await User.findOne({ shopifyCustomerId: customerId.toString() });
        if (existingUserByShopifyId) {
            console.log('ℹ️ User already exists with Shopify ID:', customerId);
            // Update existing user with full data if available
            if (email && email !== existingUserByShopifyId.email) {
                existingUserByShopifyId.email = email;
                existingUserByShopifyId.fullname = fullname;
                if (phone) existingUserByShopifyId.phone = phone;
                await existingUserByShopifyId.save();
                console.log('✅ Updated existing user with full customer data');
            }
            return { success: true, message: 'User already exists', userId: existingUserByShopifyId._id };
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
