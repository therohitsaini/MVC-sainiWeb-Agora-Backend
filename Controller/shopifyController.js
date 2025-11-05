const crypto = require('crypto');
const dotenv = require('dotenv');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const querystring = require("querystring");
dotenv.config();
const { shopModel } = require('../Modal/shopify');
const { User } = require('../Modal/userSchema');
const { manageShopifyUser } = require('../MiddleWare/ShopifyMiddleware/handleShopifyUser');
let axios, wrapper, CookieJar;
try {
    axios = require("axios");
    wrapper = require("axios-cookiejar-support").wrapper;
    CookieJar = require("tough-cookie").CookieJar;
} catch (e) {
    // Optional deps not installed; auto-login will be disabled
}



const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY_ || "1844b97873b270b025334fd34790185c";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET_ || "85cce65962f7a73df3634b28a9aaa054";
const SCOPES = process.env.SCOPES || "read_customers,read_products,read_orders,read_themes";
const APP_URL = process.env.APP_URL || "http://localhost:5001";
const SESSION_SECRET = process.env.SESSION_SECRET || "dgtetwtgwtdgsvdggsd";
const JWT_SRCURITE_KEY = process.env.JWT_SECRET_KEY || "hytfrdghbgfcfcrfffff";
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING

const installShopifyApp = (req, res) => {
    console.log("installShopifyApp");
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

// const authCallback = async (req, res) => {

//     console.log("authCallback___________", SHOPIFY_API_SECRET);
//     const { shop, code, hmac, state } = req.query;
//     // console.log("shop", shop, code, hmac,);

//     const params = { ...req.query };
//     delete params['hmac'];
//     delete params['signature'];
//     const message = Object.keys(params)
//         .sort()
//         .map(k => `${k}=${params[k]}`)
//         .join('&');

//     const calculated = crypto
//         .createHmac('sha256', "85cce65962f7a73df3634b28a9aaa054")
//         .update(message)
//         .digest('hex')
//         .toLowerCase();
//     console.log("calculated", calculated);
//     const received = String(hmac || '').toLowerCase();
//     console.log("received", received);
//     if (received.length !== calculated.length ||
//         !crypto.timingSafeEqual(Buffer.from(calculated, 'utf8'), Buffer.from(received, 'utf8')))
//         return res.status(400).send("HMAC_____ validation failed");

//     try {
//         const tokenRes = await axios.post(`https://${shop}/admin/oauth/access_token`, {
//             client_id: SHOPIFY_API_KEY,
//             client_secret: SHOPIFY_API_SECRET,
//             code
//         });

//         const accessToken = tokenRes.data.access_token;
//         const existingShop = await shopModel.findOne({ shop: shop });
//         if (existingShop) {
//             existingShop.accessToken = accessToken;
//             existingShop.installedAt = new Date();
//             await existingShop.save();
//             console.log('✅ Updated access token for shop:', shop);
//         } else {
//             const newShop = new shopModel({ shop: shop, accessToken: accessToken });

//             await newShop.save();
//             console.log('✅ Created new shop entry:', shop);
//         }

//         // Redirect user to dashboard
//         res.redirect(`https://agora-ui-git-main-rohits-projects-f44a0e3e.vercel.app/dashboard/home?shop=${shop}`);

//     } catch (err) {
//         console.error(err.response?.data || err.message);
//         res.status(500).send("Failed to get access token");
//     }

// };



const authCallback = async (req, res) => {
    try {
        console.log("🔁 Auth callback triggered");

        const { shop, hmac, code } = req.query;

        // --- STEP 1: Validate presence of required params
        if (!shop || !hmac || !code) {
            console.log("❌ Missing required parameters");
            return res.status(400).send("Missing required parameters");
        }

        // --- STEP 2: Create message for HMAC validation
        const { hmac: _hmac, signature, ...params } = req.query;

        // Shopify requires the params to be sorted alphabetically
        const message = Object.keys(params)
            .sort()
            .map((key) => `${key}=${params[key]}`)
            .join("&");

        // --- STEP 3: Generate HMAC using your Shopify app secret
        const generatedHmac = crypto
            .createHmac("sha256", process.env.SHOPIFY_API_SECRET_)
            .update(message)
            .digest("hex");

        console.log("🧮 Generated HMAC:", generatedHmac);
        console.log("📦 Received HMAC:", hmac);

        // --- STEP 4: Compare HMAC
        if (generatedHmac !== hmac) {
            console.log("❌ HMAC validation failed");
            console.log("🔍 Message used for validation:", message);
             res.status(400).send("HMAC validation failed");
        }

        console.log("✅ HMAC validation successful");

        // --- STEP 5: Exchange code for access token
        const tokenResponse = await axios.post(
            `https://${shop}/admin/oauth/access_token`,
            {
                client_id: process.env.SHOPIFY_API_KEY_,
                client_secret: process.env.SHOPIFY_API_SECRET_,
                code,
            }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log("🔑 Access token received:", accessToken ? "Yes" : "No");

        // --- STEP 6: Save shop info to MongoDB
        let shopDoc = await shopModel.findOne({ shop });

        if (shopDoc) {
            shopDoc.accessToken = accessToken;
            shopDoc.installedAt = new Date();
            await shopDoc.save();
            console.log("✅ Updated existing shop:", shop);
        } else {
            await new shopModel({
                shop,
                accessToken,
                installedAt: new Date(),
            }).save();
            console.log("✅ Added new shop:", shop);
        }

        // --- STEP 7: Redirect to your frontend dashboard
        const redirectUrl = `https://agora-ui-git-main-rohits-projects-f44a0e3e.vercel.app/dashboard/home?shop=${shop}`;
        console.log("➡️ Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error("❌ Auth callback error:", error.response?.data || error.message);
        return res.status(500).send("Failed to complete authentication");
    }
};



const shopifyLogin = async (req, res) => {
    console.log("shopifyLogin");
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

        // If customer is logged in, register them in our database
        if (shop && customerId) {
            try {
                const result = await manageShopifyUser(shop, customerId);
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

        const pageHtml = `
          <!DOCTYPE html>
          <html>
            ${headHtml}
            <body style="margin:0;padding:0;">
              ${headerHtml}
              <main style="min-height:70vh;">
                <iframe 
                  src="https://tangerine-tapioca-c659db.netlify.app/home" 
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








module.exports = {
    installShopifyApp,
    authCallback,
    shopifyLogin,
    proxyThemeAssetsController,
    proxyShopifyConsultantPage,


}