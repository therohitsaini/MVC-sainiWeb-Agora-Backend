const crypto = require('crypto');
const dotenv = require('dotenv');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
dotenv.config();
const { shopModel } = require('../Modal/shopify');
const { User } = require('../Modal/userSchema');
let axios, wrapper, CookieJar;
try {
    axios = require("axios");
    wrapper = require("axios-cookiejar-support").wrapper;
    CookieJar = require("tough-cookie").CookieJar;
} catch (e) {
    // Optional deps not installed; auto-login will be disabled
}



const SHOPIFY_API_KEY = "9670f701d5332dc0e886440fd2277221";
const SHOPIFY_API_SECRET = "c29681750a54ed6a6f8f3a7d1eaa5f14";
const SCOPES = process.env.SCOPES || "read_products,read_orders,read_customers,read_themes,read_discounts,read_shipping,read_inventory,read_locations,read_metaobjects,read_price_rules,read_reports,read_themes,read_transactions,read_users,read_webhooks,write_products,write_orders,write_customers,write_themes,write_discounts,write_shipping,write_inventory,write_locations,write_metaobjects,write_price_rules,write_reports,write_themes,write_transactions,write_users,write_webhooks";
const APP_URL = process.env.APP_URL || "http://localhost:5001";
const SESSION_SECRET = process.env.SESSION_SECRET || "dgtetwtgwtdgsvdggsd";
const JWT_SRCURITE_KEY = process.env.JWT_SECRET_KEY || "hytfrdghbgfcfcrfffff";
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING

const installShopifyApp = (req, res) => {
    const shop = req.query.shop;
    if (!shop) return res.status(400).send("Missing shop param");
    const state = crypto.randomBytes(16).toString('hex');

    const redirectUri = `${APP_URL}/auth/callback`;

    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY
        }&scope=${SCOPES
        }&redirect_uri=${encodeURIComponent(redirectUri)
        }&state=${state}`;

    res.redirect(installUrl);
};

const authCallback = async (req, res) => {
    const { shop, code, hmac, state } = req.query;

    // if (state !== req.session.shopifyState)
    //     return res.status(400).send("Invalid state");

    const params = { ...req.query };
    delete params['hmac'];
    delete params['signature'];
    const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const generatedHash = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');

    if (generatedHash !== hmac)
        return res.status(400).send("HMAC validation failed");

    try {
        const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code
        });

        const accessToken = tokenRes.data.access_token;

        // Save shop to DB
        const newShop = new shopModel({ shop: shop, accessToken: accessToken });
        await newShop.save();

        // Redirect user to dashboard
        res.redirect(`https://agora-ui-git-main-rohits-projects-f44a0e3e.vercel.app/dashboard/home?shop=${shop}`);

    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send("Failed to get access token");
    }

};


const shopifyLogin = async (req, res) => {
    try {
        const { hmac, shop, host, timestamp } = req.query;
        if (!hmac || !shop || !timestamp) {
            return res.status(400).send("Missing required query params");
        }

        const params = { ...req.query };
        delete params['hmac'];
        const message = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
        const generatedHash = crypto.createHmac('sha256', SHOPIFY_API_SECRET).update(message).digest('hex');
        if (generatedHash !== hmac) {
            return res.status(400).send("HMAC validation failed");
        }

        // Optionally verify shop exists in DB (installed app)
        const shopData = await shopModel.findOne({ shop: shop });
        if (!shopData) {
            return res.status(403).send("Shop not installed");
        }

        // Issue JWT for your frontend to consume
        const token = JWT.sign({ shop }, JWT_SRCURITE_KEY, { expiresIn: '2h' });
        const frontend = process.env.FRONTEND_URL || 'https://agora-ui-v2.netlify.app/home';

        const redirectUrl = `${frontend}?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`;
        return res.redirect(302, redirectUrl);
    } catch (err) {
        console.error(err.response?.data || err.message);
        return res.status(500).send("Failed to login via Shopify");
    }
}



/** Proxy for Shopify Theme Assets 
 * 1. GET /apps/theme/header?shop=store.myshopify.com
 * 2. GET /apps/theme/footer?shop=store.myshopify.com
*/

const proxyThemeAssetsController = async (req, res) => {
    try {

        const shop = req.query.shop
        const themeId = req.query.theme_id;
        const customerId = req.query.logged_in_customer_id;

        if (shop && customerId) {
            try {
                const result = await shopifyUserRegistrationController(shop, customerId);
                if (result.success) {
                    console.log("✅ Customer registration:", result.message, result.userId ? `userId: ${result.userId}` : '');
                } else {
                    console.log("⚠️ Customer registration failed:", result.message);
                }
            } catch (error) {
                console.error("❌ Error registering customer:", error.message);
            }
        }
        const cookieHeader = req.headers.cookie || "";
        const userAgent = req.headers["user-agent"] || "node";
        const makeUrl = (base) => themeId ? `${base}${base.includes("?") ? "&" : "?"}theme_id=${themeId}` : base;
        const fetchWithSession = (url) => fetch(url, { headers: { Cookie: cookieHeader, "User-Agent": userAgent }, redirect: "manual" });
        let homeResp = await fetchWithSession(makeUrl(`https://${shop}/`));

        if (homeResp.status >= 300 && homeResp.status < 400) {
            const storefrontPassword = process.env.STOREFRONT_PASSWORD || 1;
            if (storefrontPassword && wrapper && CookieJar && axios) {
                const jar = new CookieJar();
                const client = wrapper(axios.create({ jar, withCredentials: true, headers: { "User-Agent": userAgent } }));
                await client.get(`https://${shop}/password`).catch(() => { });
                await client.post(`https://${shop}/password`, new URLSearchParams({ password: storefrontPassword }).toString(), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    maxRedirects: 0, validateStatus: () => true
                });
                homeResp = await client.get(makeUrl(`https://${shop}/`));
                var jarFetch = async (url) => (await client.get(url)).data;
            } else {
                return res.status(401).send("Storefront locked. Enter password or use preview.");
            }
        }


        const homeHtml = typeof homeResp.data === "string" ? homeResp.data : (await homeResp.text());
        const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
        const headHtml = headMatch ? headMatch[0] : `
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Agora App</title>
          </head>`;

        const sectionFetch = typeof jarFetch === "function"
            ? (url) => jarFetch(url)
            : (url) => fetchWithSession(url).then(r => r.text());

        const [headerHtml, footerHtml] = await Promise.all([
            sectionFetch(makeUrl(`https://${shop}/?section_id=header`)),
            sectionFetch(makeUrl(`https://${shop}/?section_id=footer`))
        ]);
        console.log("headerHtml on theme assets page", headerHtml);
        const pageHtml = `
          <!DOCTYPE html>
          <html>
            ${headHtml}
            <body style="margin:0;padding:0;">
              ${headerHtml}
              <main style="min-height:70vh;">
                <iframe 
                  src="https://agora-ui-v2.netlify.app/home" 
                  style="border:none;width:100%;height:100vh;display:block;"
                ></iframe>
              </main>
              ${footerHtml}
            </body>
          </html>`;
        return res.status(200).send(pageHtml);
    }

    catch (e) {
        console.error("/apps/agora error:", e);
        return res.status(500).send("Failed to compose Shopify header/footer");
    }
}

/** Proxy for Shopify Consultant Registration Page 
 * 1. GET /apps/agora/consultant-registration?shop=store.myshopify.com
 * 2. GET /apps/agora/consultant-registration?shop=store.myshopify.com&theme_id=1234567890
*/
const proxyShopifyConsultantPage = async (req, res) => {
    try {
        const shop = req.query.shop
        const themeId = req.query.theme_id;
        const cookieHeader = req.headers.cookie || "";
        const userAgent = req.headers["user-agent"] || "node";
        const makeUrl = (base) => themeId ? `${base}${base.includes("?") ? "&" : "?"}theme_id=${themeId}` : base;
        const fetchWithSession = (url) => fetch(url, { headers: { Cookie: cookieHeader, "User-Agent": userAgent }, redirect: "manual" });

        let homeResp = await fetchWithSession(makeUrl(`https://${shop}/`));

        if (homeResp.status >= 300 && homeResp.status < 400) {
            const storefrontPassword = process.env.STOREFRONT_PASSWORD || 1;
            if (storefrontPassword && wrapper && CookieJar && axios) {
                const jar = new CookieJar();
                const client = wrapper(axios.create({ jar, withCredentials: true, headers: { "User-Agent": userAgent } }));
                // visit password page to establish cookies
                await client.get(`https://${shop}/password`).catch(() => { });
                // submit password form
                await client.post(`https://${shop}/password`, new URLSearchParams({ password: storefrontPassword }).toString(), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    maxRedirects: 0, validateStatus: () => true
                });
                homeResp = await client.get(makeUrl(`https://${shop}/`));
                var jarFetch = async (url) => (await client.get(url)).data;
            } else {
                return res.status(401).send("Storefront locked. Enter password or use preview.");
            }
        }
        const homeHtml = typeof homeResp.data === "string" ? homeResp.data : (await homeResp.text());
        const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
        const headHtml = headMatch ? headMatch[0] : `
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Agora App</title>
          </head>`;

        const sectionFetch = typeof jarFetch === "function"
            ? (url) => jarFetch(url)
            : (url) => fetchWithSession(url).then(r => r.text());

        const [headerHtml, footerHtml] = await Promise.all([
            sectionFetch(makeUrl(`https://${shop}/?section_id=header`)),
            sectionFetch(makeUrl(`https://${shop}/?section_id=footer`))
        ]);

        const pageHtml = `
          <!DOCTYPE html>
          <html>
            ${headHtml}
            <body style="margin:0;padding:0;">
              ${headerHtml}
              <main style="min-height:70vh;">
                <iframe 
                  src="https://agora-ui-v2.netlify.app/consultant-login" 
                  style="border:none;width:100%;height:100vh;display:block;"
                ></iframe>
              </main>
              ${footerHtml}
            </body>
          </html>`;
        return res.status(200).send(pageHtml);
    }

    catch (e) {
        console.error("/apps/agora error:", e);
        return res.status(500).send("Failed to compose Shopify header/footer");
    }
}


/**
 * user resgitertion controller 
 * for registertaion use shopify signup page proxy
 * 
 */

const getCustomerDetail = async (shop, customerId) => {
    try {

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

const shopifyUserRegistrationController = async (shop, customerId) => {
    try {
        // Validate inputs
        if (!shop || !customerId) {
            console.error('Missing shop or customerId:', { shop, customerId });
            return { success: false, message: 'Shop and customerId are required' };
        }

        // Fetch customer data from Shopify via GraphQL
        const customer = await getCustomerDetail(shop, customerId);
        
        if (!customer) {
            console.error('Failed to fetch customer data from Shopify:', { shop, customerId });
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
            console.log('User already exists:', email);
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
            console.log('Duplicate key on save - user already exists');
            return { success: true, message: 'User already exists' };
        }
        console.error("❌ Error in shopifyUserRegistrationController:", err?.message || err);
        return { success: false, message: err?.message || 'Failed to register user' };
    }
}






module.exports = {
    installShopifyApp,
    authCallback,
    shopifyLogin,
    proxyThemeAssetsController,
    proxyShopifyConsultantPage,
 

}