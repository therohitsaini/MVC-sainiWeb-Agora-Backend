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
let axios, wrapper, CookieJar;
try {
    axios = require("axios");
    wrapper = require("axios-cookiejar-support").wrapper;
    CookieJar = require("tough-cookie").CookieJar;
} catch (e) {
    // Optional deps not installed; auto-login will be disabled
}


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

    console.log("req.query", req.query);
    console.log("installShopifyApp");
    console.log("client_id", client_id);
    console.log("SHOPIFY_API_SECRET", SHOPIFY_API_SECRET);

    // Validation: client_id aur secret check karo
    if (!client_id || !SHOPIFY_API_SECRET) {
        return res.status(400).send("client_id or SHOPIFY_API_SECRET is not set");
    }

    // Shop name extract karo (e.g., "store-name.myshopify.com")
    const shop = req.query.shop;
    console.log("shop", shop);
    if (!shop) return res.status(400).send("Missing shop param");

    // Security ke liye random state generate karo (CSRF protection)
    const state = crypto.randomBytes(16).toString('hex');
    console.log("state", state);

    // Callback URL define karo - yaha Shopify redirect karega after approval
    // Request se dynamically URL banaye (environment variable me ${HOST}/${PORT} resolve nahi ho rahe)
    let baseUrl = APP_URL;

    // Agar APP_URL me ${HOST} ya ${PORT} hai, to request se extract karo
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
        const redirectUrl = `https://projectable-eely-minerva.ngrok-free.dev/?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}&adminId=${encodeURIComponent(AdminiId)}`;
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
        const frontend = 'https://shopifyconsultant-app.vercel.app/home';

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

        // React App URL - iframe ke bina directly load karo
        const reactAppBaseUrl = process.env.REACT_APP_URL || "https://projectable-eely-minerva.ngrok-free.dev";
        const reactAppPath = "/consultant-cards";
        const reactAppFullUrl = `${reactAppBaseUrl}${reactAppPath}`;
        const customerIdParam = userId?.userId || '';
        const shopIdParam = shopDocId?._id || '';
        
        // React App ka HTML fetch karo (scripts, styles, aur body content extract karne ke liye)
        let reactAppStyles = '';
        let reactAppScripts = '';
        let reactAppBodyContent = '';
        
        try {
            console.log("Fetching React app from:", reactAppFullUrl);
            const reactResponse = await fetch(reactAppFullUrl, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });
            
            console.log("React app response status:", reactResponse.status);
            
            if (reactResponse.ok) {
                const reactHtml = await reactResponse.text();
                console.log("React HTML fetched, length:", reactHtml.length);
                console.log("React HTML preview (first 1000 chars):", reactHtml.substring(0, 1000));
                
                // Check if it's actually React HTML or error page
                const isErrorPage = reactHtml.includes('error.js') || 
                                   reactHtml.includes('cdn.ngrok.com/static/js/error.js') ||
                                   reactHtml.includes('ngrok') && reactHtml.includes('error') ||
                                   reactHtml.includes('404') && reactHtml.includes('Not Found') ||
                                   reactHtml.includes('This site can') && reactHtml.includes('t be reached');
                
                if (isErrorPage) {
                    console.error("❌ ERROR: ngrok error page detected! React app URL wrong hai ya ngrok tunnel down hai.");
                    console.error("Please check:");
                    console.error("1. React app URL sahi hai: " + reactAppFullUrl);
                    console.error("2. ngrok tunnel running hai ya nahi");
                    console.error("3. React app server running hai ya nahi");
                    console.error("4. React app path correct hai ya nahi (/consultant-cards)");
                    // Don't process error page, return early
                    reactAppScripts = '';
                    reactAppBodyContent = '<div style="padding:20px;text-align:center;"><h3>⚠️ React App Not Available</h3><p>Please check React app URL and ngrok tunnel.</p><p>URL: ' + reactAppFullUrl + '</p></div>';
                } else {
                    // Only process if it's not an error page
                    if (reactHtml.includes('<!DOCTYPE html>') || reactHtml.includes('<html')) {
                        console.log("✅ Valid HTML structure found");
                    } else {
                        console.warn("⚠️ HTML structure might be invalid");
                    }
                    
                    // Extract head content (styles, meta tags, etc.)
                const headMatch = reactHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
                let headScripts = '';
                if (headMatch) {
                    const headContent = headMatch[1];
                    
                    // Extract scripts from head (React apps me scripts head me bhi ho sakte hain)
                    const headScriptMatches = headContent.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
                    console.log("Found script tags in head:", headScriptMatches.length);
                    headScripts = headScriptMatches
                        .filter(script => {
                            // Filter out ngrok error scripts
                            const srcMatch = script.match(/src=["']([^"']+)["']/i);
                            if (srcMatch) {
                                const src = srcMatch[1];
                                if (src.includes('cdn.ngrok.com') || src.includes('error.js') || src.includes('allerrors.js')) {
                                    console.log("Filtering out ngrok error script:", src);
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map((script, index) => {
                            const srcMatch = script.match(/src=["']([^"']+)["']/i);
                            if (srcMatch) {
                                const originalSrc = srcMatch[1];
                                if (!originalSrc.startsWith('http')) {
                                    const absoluteUrl = originalSrc.startsWith('/') 
                                        ? `${reactAppBaseUrl}${originalSrc}`
                                        : `${reactAppBaseUrl}/${originalSrc}`;
                                    console.log("Converting head script URL:", originalSrc, "->", absoluteUrl);
                                    return script.replace(originalSrc, absoluteUrl);
                                }
                            }
                            return script;
                        })
                        .join('\n');
                    console.log("Head scripts after filtering:", headScripts.length > 0 ? "Found" : "None");
                    
                    // Extract link tags (CSS files)
                    const linkMatches = headContent.match(/<link[^>]*>/gi) || [];
                    reactAppStyles = linkMatches
                        .map(link => {
                            // Relative URLs ko absolute me convert karo
                            const hrefMatch = link.match(/href=["']([^"']+)["']/i);
                            if (hrefMatch && !hrefMatch[1].startsWith('http')) {
                                const absoluteUrl = hrefMatch[1].startsWith('/') 
                                    ? `${reactAppBaseUrl}${hrefMatch[1]}`
                                    : `${reactAppBaseUrl}/${hrefMatch[1]}`;
                                return link.replace(hrefMatch[1], absoluteUrl);
                            }
                            return link;
                        })
                        .join('\n');
                }
                
                // Extract body content (React app ka actual HTML content)
                const bodyMatch = reactHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) {
                    const bodyContent = bodyMatch[1];
                    
                    // Extract all script tags from body (pehle scripts extract karo)
                    const bodyScriptMatches = bodyContent.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];
                    console.log("Found script tags in body:", bodyScriptMatches.length);
                    
                    // Combine head and body scripts
                    const allScriptMatches = [...(headScripts ? [headScripts] : []), ...bodyScriptMatches];
                    console.log("Total script tags found (head + body):", allScriptMatches.length);
                    
                    if (allScriptMatches.length === 0) {
                        console.warn("⚠️ No script tags found in React app (head or body)!");
                        console.warn("React HTML preview (first 500 chars):", reactHtml.substring(0, 500));
                    }
                    
                    // Process all scripts (head + body)
                    const processedScripts = [];
                    
                    // Process head scripts (already processed, just add)
                    if (headScripts) {
                        processedScripts.push(headScripts);
                    }
                    
                    // Process body scripts (filter out ngrok error scripts)
                    bodyScriptMatches
                        .filter(script => {
                            // Filter out ngrok error scripts
                            const srcMatch = script.match(/src=["']([^"']+)["']/i);
                            if (srcMatch) {
                                const src = srcMatch[1];
                                if (src.includes('cdn.ngrok.com') || src.includes('error.js') || src.includes('allerrors.js')) {
                                    console.log("Filtering out ngrok error script:", src);
                                    return false;
                                }
                            }
                            return true;
                        })
                        .forEach((script, index) => {
                            const scriptPreview = script.substring(0, 100);
                            console.log("Processing body script " + (index + 1) + ":", scriptPreview);
                            
                            // Relative URLs ko absolute me convert karo
                            const srcMatch = script.match(/src=["']([^"']+)["']/i);
                            if (srcMatch) {
                                const originalSrc = srcMatch[1];
                                if (!originalSrc.startsWith('http')) {
                                    const absoluteUrl = originalSrc.startsWith('/') 
                                        ? `${reactAppBaseUrl}${originalSrc}`
                                        : `${reactAppBaseUrl}/${originalSrc}`;
                                    console.log("Converting body script URL:", originalSrc, "->", absoluteUrl);
                                    processedScripts.push(script.replace(originalSrc, absoluteUrl));
                                } else {
                                    console.log("Body script already has absolute URL:", originalSrc);
                                    processedScripts.push(script);
                                }
                            } else {
                                // Inline script (no src attribute)
                                console.log("Inline body script found (no src)");
                                processedScripts.push(script);
                            }
                        });
                    
                    reactAppScripts = processedScripts.join('\n');
                    console.log("Total scripts length:", reactAppScripts.length);
                    console.log("Total processed scripts count:", processedScripts.length);
                    
                    // Check if we have React app scripts (not just ngrok errors)
                    const hasReactScripts = reactAppScripts.length > 0 && 
                                           !reactAppScripts.includes('cdn.ngrok.com') &&
                                           !reactAppScripts.includes('error.js');
                    
                    if (!hasReactScripts) {
                        console.error("❌ WARNING: No React app scripts found! Only ngrok error scripts were extracted.");
                        console.error("This means React app HTML me actual React scripts nahi hain.");
                        console.error("Possible issues:");
                        console.error("1. React app URL wrong hai: " + reactAppFullUrl);
                        console.error("2. React app properly serve nahi ho rahi");
                        console.error("3. React app build path different hai");
                        console.error("4. React app SPA hai aur scripts dynamically load hote hain");
                    } else {
                        console.log("✅ React app scripts found!");
                    }
                    
                    if (reactAppScripts.length > 0) {
                        console.log("First 200 chars of scripts:", reactAppScripts.substring(0, 200));
                    }
                    
                    // Body content extract karo (scripts ko remove karke)
                    // React app ka actual HTML content (jo root div me hai)
                    reactAppBodyContent = bodyContent
                        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Scripts remove
                        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '') // Noscript remove
                        .trim();
                    
                    console.log("Body content extracted, length:", reactAppBodyContent.length);
                    
                    // Agar body content me root div hai, to uske andar ka content extract karo
                    const rootDivMatch = reactAppBodyContent.match(/<div[^>]*id=["']root["'][^>]*>([\s\S]*?)<\/div>/i);
                    if (rootDivMatch) {
                        reactAppBodyContent = rootDivMatch[1];
                        console.log("Root div content extracted");
                    }
                } else {
                    console.warn("Body tag not found in React HTML");
                }
                } // End of else block (only process if not error page)
            } else {
                console.error("React app response not OK:", reactResponse.status, reactResponse.statusText);
            }
        } catch (error) {
            console.error("Error fetching React app HTML:", error.message);
            console.error("Stack:", error.stack);
        }
        
        // Fallback: Agar scripts nahi mile, to common React build paths try karo
        if (!reactAppScripts || reactAppScripts.length === 0) {
            console.warn("⚠️ No scripts found, trying fallback paths...");
            const commonScriptPaths = [
                '/static/js/main.js',
                '/static/js/bundle.js',
                '/assets/index.js',
                '/index.js',
                '/main.js',
                '/bundle.js'
            ];
            
            const fallbackScripts = commonScriptPaths
                .map(path => {
                    const fullPath = path.startsWith('/') 
                        ? `${reactAppBaseUrl}${path}`
                        : `${reactAppBaseUrl}/${path}`;
                    return `<script src="${fullPath}"></script>`;
                })
                .join('\n');
            
            console.log("Fallback scripts generated:", fallbackScripts);
            // Note: Fallback scripts ko use mat karo automatically, sirf log karo
            // Kyunki ye wrong ho sakte hain
        }

        const pageHtml = `
          <!DOCTYPE html>
          <html>
            ${headHtml}
            ${reactAppStyles}
            <body style="margin:0;padding:0;">
                <script>
                    // Test ke liye - Data passing optional (comment out kar sakte ho)
                    // Agar data chahiye to uncomment karo
                    /*
                    window.SHOPIFY_APP_DATA = {
                        customerId: "${customerIdParam}",
                        shopId: "${shopIdParam}",
                        shop: "${shop || ''}",
                        customerIdRaw: "${customerId || ''}",
                        reactAppUrl: "${reactAppBaseUrl}"
                    };
                    */
                </script>
              <main style="min-height:70vh;">
                  ${headerHtml}
                  
                  <!-- React App Container - React app yaha mount hoga (no iframe) -->
                  <div id="root" style="width:100%;min-height:70vh;">
                      ${reactAppBodyContent || `
                          <!-- Loading state - Agar body content nahi mila -->
                          <div style="display:flex;justify-content:center;align-items:center;min-height:50vh;">
                              <p>Loading...</p>
                          </div>
                      `}
                  </div>
                  
                  ${footerHtml}
              </main>
              
              <!-- React App Scripts - Load React bundle dynamically -->
              ${reactAppScripts || '<!-- No scripts found -->'}
              
              <!-- Enhanced Debugging aur Error Handling -->
              <script>
                  console.log('=== React App Loading Debug ===');
                  console.log('React App Base URL:', '${reactAppBaseUrl}');
                  console.log('React App Full URL:', '${reactAppFullUrl}');
                  console.log('Scripts found:', ${reactAppScripts ? 'true' : 'false'});
                  console.log('Scripts length:', ${reactAppScripts ? reactAppScripts.length : 0});
                  
                  // Script loading errors catch karo
                  window.addEventListener('error', function(e) {
                      console.error('=== Script Loading Error ===');
                      console.error('Error:', e.message);
                      console.error('Source:', e.filename || e.src || 'unknown');
                      console.error('Line:', e.lineno);
                      console.error('Column:', e.colno);
                      console.error('Stack:', e.error ? e.error.stack : 'No stack');
                      
                      // CORS error check
                      if (e.message.includes('CORS') || e.message.includes('cross-origin')) {
                          console.error('❌ CORS Error detected! React app server me CORS enable karo.');
                      }
                      
                      // Network error check
                      if (e.message.includes('Failed to fetch') || e.message.includes('network')) {
                          console.error('❌ Network Error! Scripts load nahi ho rahe.');
                      }
                  }, true);
                  
                  // Unhandled promise rejections
                  window.addEventListener('unhandledrejection', function(e) {
                      console.error('=== Unhandled Promise Rejection ===');
                      console.error('Reason:', e.reason);
                  });
                  
                  // React app load hone ke baad check karo
                  window.addEventListener('load', function() {
                      console.log('=== Page Loaded ===');
                      const root = document.getElementById('root');
                      console.log('Root element:', root);
                      console.log('Root innerHTML length:', root ? root.innerHTML.length : 0);
                      
                      // Check karo ki scripts load hue ya nahi
                      const allScripts = document.querySelectorAll('script[src]');
                      console.log('Total script tags with src:', allScripts.length);
                      
                      allScripts.forEach(function(script, index) {
                          console.log(\`Script \${index + 1}:\`, script.src);
                          script.addEventListener('error', function() {
                              console.error(\`❌ Script failed to load: \${script.src}\`);
                          });
                          script.addEventListener('load', function() {
                              console.log(\`✅ Script loaded: \${script.src}\`);
                          });
                      });
                      
                      // Check React availability
                      setTimeout(function() {
                          console.log('=== React Check (after 2s) ===');
                          console.log('React available:', typeof window.React !== 'undefined');
                          console.log('ReactDOM available:', typeof window.ReactDOM !== 'undefined');
                          console.log('Root content:', root ? root.innerHTML.substring(0, 200) : 'No root');
                          
                          // Agar React app mount nahi hua after 5 seconds
                          if (root && (root.innerHTML.includes('Loading...') || root.innerHTML.trim() === '')) {
                              console.error('❌ React app mount nahi hua. Possible issues:');
                              console.error('1. Scripts properly load nahi hue - check console errors above');
                              console.error('2. React app ka base path wrong hai');
                              console.error('3. CORS issues ho sakte hain - check network tab');
                              console.error('4. React app ka build path different hai');
                              console.error('5. Scripts me relative paths issue ho sakta hai');
                              
                              // Try to manually check script URLs
                              console.log('\\n=== Checking Script URLs ===');
                              allScripts.forEach(function(script) {
                                  if (script.src) {
                                      fetch(script.src, { method: 'HEAD' })
                                          .then(function(response) {
                                              console.log(\`✅ \${script.src} - Status: \${response.status}\`);
                                          })
                                          .catch(function(error) {
                                              console.error(\`❌ \${script.src} - Error: \${error.message}\`);
                                          });
                                  }
                              });
                          } else {
                              console.log('✅ React app successfully mounted!');
                          }
                      }, 5000);
                  });
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



// const proxyThemeAssetsController = async (req, res) => {
//     try {

//         const shop = req.query.shop
//         const themeId = req.query.theme_id;
//         const customerId = req.query.logged_in_customer_id;
//         let userId;
//         if (shop && customerId) {
//             try {
//                 const result = await manageShopifyUser(shop, customerId);
//                 userId = result;
//                 console.log("result", result);
//                 if (result.success) {
//                     console.log("✅ Customer registration:", result.message, result.userId ? `userId: ${result.userId}` : '');
//                 } else {
//                     console.log("⚠️ Customer registration failed:", result.message);
//                 }
//             } catch (error) {
//                 console.error("❌ Error registering customer:", error.message);
//             }
//         }

//         const shopDocId = await shopModel.findOne({ shop: shop });
//         console.log("userId__shop", shopDocId._id);
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
//                 await client.get(`https://${shop}/password`).catch(() => { });
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

//         // Fetch consultant cards HTML from your ngrok SPA root (no iframe)
//         // We load the root ("/") with a view query so React can route to /consultant-cards client-side.
//         const consultantUrl = `https://projectable-eely-minerva.ngrok-free.dev/consultant-cards&customerId=${userId?.userId || ''}&shopid=${shopDocId._id || ''}`;
//         let consultantHtml = '';
//         try {
//             const consultantResp = await axios.get(consultantUrl);
//             consultantHtml = consultantResp.data || '';

//             // If the external app returns a full HTML document, strip outer shells
//             consultantHtml = consultantHtml
//                 .replace(/<!DOCTYPE html>/gi, '')
//                 .replace(/<\/?html[^>]*>/gi, '')
//                 .replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, '')
//                 .replace(/<\/?body[^>]*>/gi, '');
//         } catch (err) {
//             console.error("Error fetching consultant-cards HTML:", err.message || err);
//             consultantHtml = '<div>Failed to load consultant content.</div>';
//         }

//         const pageHtml = `
//           <!DOCTYPE html>
//           <html>
//             ${headHtml}
//             <body style="margin:0;padding:0;">
//               <main style="min-height:70vh;">
//                 ${headerHtml}
//                 <div id="agora-consultant-root">
//                   ${consultantHtml}
//                 </div>
//                 ${footerHtml}
//               </main>
//             </body>
//           </html>
//           `;
//         return res.status(200).send(pageHtml);
//     }

//     catch (e) {
//         console.error("/apps/agora error:", e);
//         return res.status(500).send("Failed to compose Shopify header/footer");
//     }
// }

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
                  src="https://projectable-eely-minerva.ngrok-free.dev/login" 
                  style="border:none;width:100%;height:100vh;display:block;"
                ></iframe>
              </main>
          
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