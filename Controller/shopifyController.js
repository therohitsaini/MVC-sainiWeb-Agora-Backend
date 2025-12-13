const crypto = require('crypto');
const dotenv = require('dotenv');
const JWT = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const querystring = require("querystring");
dotenv.config();
const { shopModel } = require('../Modal/shopify');
const { User } = require('../Modal/userSchema');
const { manageShopifyUser } = require('../MiddleWare/ShopifyMiddleware/handleShopifyUser');
const { createAppMenu } = require('../MiddleWare/shopifySubMenu');
const { renderShopifyPage } = require('../MiddleWare/ShopifyMiddleware/helperTheme');
let axios, wrapper, CookieJar;
try {
    axios = require("axios");
    wrapper = require("axios-cookiejar-support").wrapper;
    CookieJar = require("tough-cookie").CookieJar;
} catch (e) {
    // Optional deps not installed; auto-login will be disabled
}


const frontendUrl = process.env.FRONTEND_URL || " https://army-kai-buffer-holder.trycloudflare.com";

const client_id = process.env.SHOPIFY_CLIENT_ID
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET
const SCOPES = process.env.SHOPIFY_SCOPES || "read_customers,read_products";
const APP_URL = process.env.APP_URL || "http://localhost:5001";
const SESSION_SECRET = process.env.SESSION_SECRET || "dgtetwtgwtdgsvdggsd";
const JWT_SRCURITE_KEY = process.env.JWT_SECRET_KEY || "hytfrdghbgfcfcrfffff";
const roundingNumber = process.env.PASSWORD_SECRECT_ROUNDING

/**
 * STEP 1: Shopify App Installation Function
 * 
 * Ye function tab call hota hai jab user Shopify store se app install karta hai
 * 
 * Flow:
 * 1. User Shopify Admin Panel se app install karta hai
 * 2. Shopify redirect karta hai: http://localhost:5001/app/install?shop=store-name.myshopify.com
 * 3. Ye function Shopify ke OAuth authorize URL par redirect karta hai
 * 4. User Shopify par permissions approve karta hai
 * 5. Shopify phir callback URL par redirect karta hai (authCallback function)
 */
const installShopifyApp = (req, res) => {

   

    if (!client_id || !SHOPIFY_API_SECRET) {
        return res.status(400).send("client_id or SHOPIFY_API_SECRET is not set");
    }

    const shop = req.query.shop;
    if (!shop) return res.status(400).send("Missing shop param");

    const state = crypto.randomBytes(16).toString('hex');
    let baseUrl = APP_URL;
    if (!baseUrl || baseUrl.includes('${HOST}') || baseUrl.includes('${PORT}')) {
        const protocol = req.protocol || 'http';
        const host = req.get('host') || req.headers.host || 'localhost:5001';
        baseUrl = `${protocol}://${host}`;
    }

    const redirectUri = `${baseUrl}/app/callback`;
    console.log("redirectUri", redirectUri);

    // Shopify OAuth authorize URL banayo
    // Ye URL user ko Shopify permission page par le jayega
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${client_id
        }&scope=${SCOPES
        }&redirect_uri=${encodeURIComponent(redirectUri)
        }&state=${state}`;
    console.log("installUrl", installUrl);

    // User ko Shopify OAuth page par redirect karo
    res.redirect(installUrl);
};



/**
 * STEP 2: OAuth Callback Function
 * 
 * Ye function automatically call hota hai jab:
 * 1. User Shopify par permissions approve kar deta hai
 * 2. Shopify redirect karta hai: http://localhost:5001/app/callback?shop=...&code=...&hmac=...
 * 
 * Complete Flow:
 * 1. User installShopifyApp se Shopify OAuth page par jata hai
 * 2. User permissions approve karta hai
 * 3. Shopify callback URL par redirect karta hai with code aur hmac
 * 4. Ye function HMAC verify karta hai (security check)
 * 5. Code ko access token me convert karta hai
 * 6. Shop info database me save karta hai
 * 7. User ko frontend dashboard par redirect karta hai
 */
const authCallback = async (req, res) => {
    try {
        console.log("🔁 Auth callback triggered");
        console.log("req.query", req.query);
        // Shopify se aaye huye query parameters extract karo
        const { shop, hmac, code, host } = req.query;
        console.log("shop", shop);
        console.log("hmac", hmac);
        console.log("code", code);
        console.log("host___Update___", host);
        // --- STEP 1: Required parameters check karo
        if (!shop || !hmac || !code) {
            console.log("❌ Missing required parameters");
            return res.status(400).send("Missing required parameters");
        }

        // --- STEP 2: HMAC validation ke liye message banayo
        // HMAC security ke liye hota hai - verify karta hai ki request Shopify se hi aayi hai
        // hmac aur signature ko exclude karo (ye validation ke liye use hoga)
        const params = { ...req.query };
        delete params.hmac;
        delete params.signature;

        // Shopify requires: parameters alphabetically sorted hone chahiye
        const sortedKeys = Object.keys(params).sort();
        const message = sortedKeys
            .map((key) => `${key}=${params[key]}`)
            .join("&");

        // --- STEP 3: Apne secret se HMAC generate karo
        const generatedHmac = crypto
            .createHmac("sha256", SHOPIFY_API_SECRET)
            .update(message)
            .digest("hex");

        // --- STEP 4: HMAC compare karo (security verification)
        // Agar match nahi kiya to request fake/unauthorized hai
        if (generatedHmac.toLowerCase() !== hmac.toLowerCase()) {
            console.log("❌ HMAC validation failed");
            return res.status(400).send("HMAC validation failed");
        }

        console.log("✅ HMAC validation successful");

        // --- STEP 5: Authorization code ko access token me convert karo
        // Ye access token se aap Shopify API calls kar sakte ho
        const tokenResponse = await axios.post(
            `https://${shop}/admin/oauth/access_token`,
            {
                client_id: client_id,
                client_secret: SHOPIFY_API_SECRET,
                code, // Temporary code jo Shopify ne diya
            }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log("accessToken_______________", accessToken);
        if (!accessToken) {
            return res.status(400).send("Failed to get access token");
        }

        const shopInfo = await axios.get(
            `https://${shop}/admin/api/2024-01/shop.json`,
            {
                headers: {
                    "X-Shopify-Access-Token": accessToken
                }
            }
        );
        const shopId = shopInfo.data.shop.id;
        const ownerEmail = shopInfo.data.shop.email;

        let shopDoc = await shopModel.findOne({ shop });

        if (shopDoc) {
            shopDoc.accessToken = accessToken;
            shopDoc.shopId = shopId;
            shopDoc.email = ownerEmail;
            shopDoc.installedAt = new Date();
            await shopDoc.save();
        } else {
            await new shopModel({
                shop,
                accessToken,
                shopId, 
                email: ownerEmail,
                installedAt: new Date(),
            
            }).save();
        }

        const AdminUser = await shopModel.findOne({ shop: shop });
        if (!AdminUser) {
            return res.status(400).send("Admin user not found");
        }
        const AdminiId = AdminUser._id;
        console.log("AdminiId", AdminiId);
        // https://projectable-eely-minerva.ngrok-free.dev/
        const redirectUrl = `${frontendUrl}/?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}&adminId=${encodeURIComponent(AdminiId)}`;
        console.log("➡️ Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
    } catch (error) {
        console.error(" Auth callback error:", error || error);
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
        const frontend = `${frontendUrl}/home`;

        const redirectUrl = `${frontend}?shop=${encodeURIComponent(shop)}&token=${encodeURIComponent(token)}`;
        console.log("➡️ Redirecting to:", redirectUrl);
        return res.redirect(redirectUrl);
    } catch (err) {
        console.error(err || err);
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
        let userId;
        if (shop && customerId) {
            try {
                const result = await manageShopifyUser(shop, customerId);
                userId = result;
                console.log("result", result);
                if (result.success) {
                    console.log("✅ Customer registration:", result.message, result.userId ? `userId: ${result.userId}` : '');
                } else {
                    console.log("⚠️ Customer registration failed:", result.message);
                }
            } catch (error) {
                console.error("❌ Error registering customer:", error.message);
            }
        }

        const shopDocId = await shopModel.findOne({ shop: shop });
        console.log("userId__shop", shopDocId._id);
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
                <script>
                    const customerId = "${customerId}";
                </script>
              <main style="min-height:100vh;">
                  ${headerHtml}
                  <iframe 
                    id="agora-frame"
                    src="${frontendUrl}/consultant-cards?customerId=${userId?.userId || ''}&shopid=${shopDocId._id || ''}" 
                    style="border:none;width:100%;min-height:700px;display:block;"
                  ></iframe>
                  ${footerHtml}
              </main>

              <!-- Parent script (MUST HAVE) -->
              <script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.6/iframeResizer.min.js"></script>
              <script>
                iFrameResize({
                  checkOrigin: false,
                  autoResize: true,
                  heightCalculationMethod: "bodyScroll",
                  minHeight: 700,
                }, "#agora-frame");
              </script>
            </body>
          </html>
          `;
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

// const proxyShopifyConsultantPage = async (req, res) => {
//     try {
//         const shop = req.query.shop
//         const themeId = req.query.theme_id;
//         const cookieHeader = req.headers.cookie || "";
//         const userAgent = req.headers["user-agent"] || "node";
//         const makeUrl = (base) => themeId ? `${base}${base.includes("?") ? "&" : "?"}theme_id=${themeId}` : base;
//         const fetchWithSession = (url) => fetch(url, { headers: { Cookie: cookieHeader, "User-Agent": userAgent }, redirect: "manual" });

//         let homeResp = await fetchWithSession(makeUrl(`https://${shop}/`));
//         if (homeResp.status >= 300 && homeResp.status < 400) {
//             const storefrontPassword = process.env.STOREFRONT_PASSWORD || 1;
//             if (storefrontPassword && wrapper && CookieJar && axios) {
//                 const jar = new CookieJar();
//                 const client = wrapper(axios.create({ jar, withCredentials: true, headers: { "User-Agent": userAgent } }));
//                 // visit password page to establish cookies
//                 await client.get(`https://${shop}/password`).catch(() => { });
//                 // submit password form
//                 await client.post(`https://${shop}/password`, new URLSearchParams({ password: storefrontPassword }).toString(), {
//                     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//                     maxRedirects: 0, validateStatus: () => true
//                 });
//                 homeResp = await client.get(makeUrl(`https://${shop}/`));
//                 var jarFetch = async (url) => (await client.get(url)).data;
//             } else {
//                 return res.status(401).send("Storefront locked. Enter password or use preview.");
//             }
//         }
//         const homeHtml = typeof homeResp.data === "string" ? homeResp.data : (await homeResp.text());
//         const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
//         const headHtml = headMatch ? headMatch[0] : `
//           <head>
//             <meta charset="UTF-8" />
//             <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//             <title>Agora App</title>
//           </head>`;
//         const sectionFetch = typeof jarFetch === "function"
//             ? (url) => jarFetch(url)
//             : (url) => fetchWithSession(url).then(r => r.text());

//         const [headerHtml, footerHtml] = await Promise.all([
//             sectionFetch(makeUrl(`https://${shop}/?section_id=header`)),
//             sectionFetch(makeUrl(`https://${shop}/?section_id=footer`))
//         ]);

//         const pageHtml = `
//           <!DOCTYPE html>
//           <html>
//             ${headHtml}
//             <body style="margin:0;padding:0;display:flex;flex-direction:column;min-height:100vh;">
//               <header style="flex-shrink:0;">
//                 ${headerHtml}
//               </header>
//               <main style="flex:1;overflow:hidden;position:relative;">
//                 <iframe 
//                   id="agora-iframe"
//                   src="https://projectable-eely-minerva.ngrok-free.dev/login" 
//                   style="border:none;width:100%;height:100%;display:block;position:absolute;top:0;left:0;"
//                 ></iframe>
//               </main>
//               <footer style="flex-shrink:0;">
//                 ${footerHtml}
//               </footer>
//               <script>
//                 // Iframe height adjustment via postMessage (optional - if React app sends height)
//                 window.addEventListener("message", function (event) {
//                   try {
//                     if (!event || !event.data || event.data.type !== "AGORA_IFRAME_HEIGHT") return;
//                     var iframe = document.getElementById("agora-iframe");
//                     if (iframe && event.data.height && Number(event.data.height) > 0) {
//                       iframe.style.height = Number(event.data.height) + "px";
//                       iframe.style.position = "relative";
//                     }
//                   } catch (e) {
//                     console.error("Error handling AGORA_IFRAME_HEIGHT message", e);
//                   }
//                 });
//               </script>
//             </body>
//           </html>`;
//         return res.status(200).send(pageHtml);
//     }

//     catch (e) {
//         console.error("/apps/agora error:", e);
//         return res.status(500).send("Failed to compose Shopify header/footer");
//     }
// }
const proxyShopifyConsultantPage = async (req, res) => {
    try {
        const shop = req.query.shop;
        const themeId = req.query.theme_id;
        const cookieHeader = req.headers.cookie || "";
        const userAgent = req.headers["user-agent"] || "node";

        const makeUrl = (base) =>
            themeId
                ? `${base}${base.includes("?") ? "&" : "?"}theme_id=${themeId}`
                : base;

        const fetchWithSession = (url) =>
            fetch(url, {
                headers: { Cookie: cookieHeader, "User-Agent": userAgent },
                redirect: "manual",
            });

        let homeResp = await fetchWithSession(makeUrl(`https://${shop}/`));
        let jarFetch = null;

        // 🔐 Handle storefront password
        if (homeResp.status >= 300 && homeResp.status < 400) {
            const password = process.env.STOREFRONT_PASSWORD;

            const jar = new CookieJar();
            const client = wrapper(
                axios.create({ jar, withCredentials: true, headers: { "User-Agent": userAgent } })
            );

            await client.get(`https://${shop}/password`).catch(() => { });
            await client.post(
                `https://${shop}/password`,
                new URLSearchParams({ password }).toString(),
                { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
            );

            homeResp = await client.get(makeUrl(`https://${shop}/`));
            jarFetch = async (url) => (await client.get(url)).data;
        }

        // ⭐ ALWAYS READ HTML SAFELY
        let homeHtml = "";

        if (homeResp.data) {
            // axios
            homeHtml = homeResp.data;
        } else {
            // fetch
            homeHtml = await homeResp.text();
        }

        // HEAD extract
        const headMatch = homeHtml.match(/<head[\s\S]*?<\/head>/i);
        const headHtml =
            headMatch?.[0] ||
            `<head><meta charset="UTF-8"><title>App</title></head>`;

        // ⭐ Safe section fetcher
        const sectionFetch = jarFetch
            ? (url) => jarFetch(url)
            : async (url) => {
                const r = await fetchWithSession(url);
                return await r.text();
            };

        const headerHtml = await sectionFetch(makeUrl(`https://${shop}/?section_id=header`));
        const footerHtml = await sectionFetch(makeUrl(`https://${shop}/?section_id=footer`));

        // Build final HTML
        const pageHtml = `
        <!DOCTYPE html>
        <html>
          ${headHtml}
          <body style="margin:0;padding:0;display:flex;flex-direction:column;min-height:100vh;">
            <header style="flex-shrink:0;">${headerHtml}</header>
            
            <main style="flex:1;overflow:hidden;position:relative;">
              <iframe 
                id="agora-iframe"
                src="${frontendUrl}/login?shop=${shop}"
                style="border:none;width:100%;min-height:700px;display:block;"
              ></iframe>
            </main>
  
            <footer style="flex-shrink:0;">${footerHtml}</footer>
  
            <!-- Parent script (MUST HAVE) -->
            <script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.6/iframeResizer.min.js"></script>
            <script>
              iFrameResize({
                checkOrigin: false,
                autoResize: true,
                heightCalculationMethod: "bodyScroll",
                minHeight: 700,
              }, "#agora-iframe");
            </script>
          </body>
        </html>
      `;

        res.status(200).send(pageHtml);
    } catch (e) {
        console.error("proxy error:", e);
        return res.status(500).send("Failed to compose Shopify header/footer");
    }
};



const proxyShopifyConsultantLoginPage = (req, res) => {
    const shop = req.query.shop;
    return renderShopifyPage(
        req,
        res,
        `${frontendUrl}/consultant-dashboard?shop=${shop}`,
        {
            title: "Consultant App"
        }
    );
};

const proxySHopifyConsultantChat = (req, res) => {
    const shop = req.query.shop;
    return renderShopifyPage(
        req,
        res,
        `${frontendUrl}/consulant-chats?shop=${shop}`,
        {
            title: "Consultant Chat"
        }
    );
};

const proxyShopifyViewProfile = (req, res) => {
    const shop = req.query.shop;
    const consultantId = req.query.consultantId || "";
    const shopId = req.query.shopId || "";
    // console.log("consultantId", consultantId);
    // console.log("shopId", shopId);
    const iframeUrl = `${frontendUrl}/view-profile?consultantId=${consultantId}&shopId=${shopId}&shop=${shop}`;

    return renderShopifyPage(
        req,
        res,
        iframeUrl,
        {
            title: "Consultant Chat"
        }
    );
};

const proxyShopifyChatSection = (req, res) => {
    console.log("req.query", req.query);
    const shop = req.query.shop;
    const consultantId = req.query.consultantId || "";
    console.log("consultantId", consultantId);

    const iframeUrl = `${frontendUrl}/chats?consultantId=${consultantId}&shop=${shop}`;
    return renderShopifyPage(
        req,
        res,
        iframeUrl,
        {
            title: "Chat Section"
        }
    );
};


module.exports = {
    installShopifyApp,
    authCallback,
    shopifyLogin,
    proxyThemeAssetsController,
    proxyShopifyConsultantPage,
    proxyShopifyConsultantLoginPage,
    proxySHopifyConsultantChat,
    proxyShopifyViewProfile,
    proxyShopifyChatSection
}