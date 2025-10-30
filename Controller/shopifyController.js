const axios = require('axios');
const crypto = require('crypto');
const dotenv = require('dotenv');
const JWT = require('jsonwebtoken');
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
const JWT_SRCURITE_KEY = process.env.JWT_SECRET_KEY || "hytfrdghbgfcfcrfffff";

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

// Helper: get published theme id
const getPublishedThemeId = async (shop, accessToken) => {
    const themes = await axios.get(`https://${shop}/admin/api/2023-10/themes.json`, {
        headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        }
    });
    const published = (themes.data.themes || []).find(t => t.role === 'main');
    if (!published) throw new Error('No published theme found');
    return published.id;
};

const getThemeAsset = async (shop, accessToken, themeId, assetKey) => {
    const resp = await axios.get(`https://${shop}/admin/api/2023-10/themes/${themeId}/assets.json`, {
        headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
        },
        params: { 'asset[key]': assetKey }
    });
    return resp.data.asset;
};

// GET /apps/theme/header?shop=store.myshopify.com
const getThemeHeader = async (req, res) => {
    try {
        const shop = req.query.shop;
        if (!shop) return res.status(400).send('Missing shop');
        const shopData = await shopModel.findOne({ shop });
        if (!shopData) return res.status(404).send('Shop not installed');
        const themeId = await getPublishedThemeId(shop, shopData.accessToken);
        const asset = await getThemeAsset(shop, shopData.accessToken, themeId, 'sections/header.liquid');
        return res.status(200).json({ key: asset.key, content: asset.value || asset.public_url || '' });
    } catch (err) {
        console.error(err.response?.data || err.message);
        return res.status(500).send('Failed to fetch header');
    }
};

// GET /apps/theme/footer?shop=store.myshopify.com
const getThemeFooter = async (req, res) => {
    try {
        const shop = req.query.shop;
        if (!shop) return res.status(400).send('Missing shop');
        const shopData = await shopModel.findOne({ shop });
        if (!shopData) return res.status(404).send('Shop not installed');
        const themeId = await getPublishedThemeId(shop, shopData.accessToken);
        const asset = await getThemeAsset(shop, shopData.accessToken, themeId, 'sections/footer.liquid');
        return res.status(200).json({ key: asset.key, content: asset.value || asset.public_url || '' });
    } catch (err) {
        console.error(err.response?.data || err.message);
        return res.status(500).send('Failed to fetch footer');
    }
};

module.exports = { installShopifyApp, authCallback, shopifyLogin, getThemeHeader, getThemeFooter }