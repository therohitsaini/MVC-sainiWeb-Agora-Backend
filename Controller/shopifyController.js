const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();
const { shopModel } = require('../Modal/shopify');

// const {
//     SHOPIFY_API_KEY,
//     SHOPIFY_API_SECRET,
//     SCOPES,
//     APP_URL = "http://localhost:3001"
// } = process.env;

const SHOPIFY_API_KEY = "9670f701d5332dc0e886440fd2277221";
const SHOPIFY_API_SECRET = "c29681750a54ed6a6f8f3a7d1eaa5f14";
const SCOPES = process.env.SCOPES || "read_products,read_orders,read_customers,read_themes,read_discounts,read_shipping,read_inventory,read_locations,read_metaobjects,read_price_rules,read_reports,read_themes,read_transactions,read_users,read_webhooks,write_products,write_orders,write_customers,write_themes,write_discounts,write_shipping,write_inventory,write_locations,write_metaobjects,write_price_rules,write_reports,write_themes,write_transactions,write_users,write_webhooks";
const APP_URL = process.env.APP_URL || "http://localhost:5001";
const SESSION_SECRET = process.env.SESSION_SECRET || "dgtetwtgwtdgsvdggsd";

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

const getProducts = async (req, res) => {
    try {

  
        return res.status(200).send(`
       <html>
        <body>
            <h1>Products Card</h1>
        </body>
       </html>
       `);

    //    https://rohit-12345839.myshopify.com/apps/pages-vcccc
        
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send("Failed to get products");
    }
}


const redirectToAgora = async (req, res) => {
    try {
        return res.status(200).send(`
       <html>
        <body>
            <h1>Redirecting to Agora</h1>
        </body>
       </html>
       `);
    } catch (err) {
        console.error(err.response?.data || err.message);
        res.status(500).send("Failed to test Shopify");
    }
}

module.exports = { installShopifyApp, authCallback, getProducts, redirectToAgora }