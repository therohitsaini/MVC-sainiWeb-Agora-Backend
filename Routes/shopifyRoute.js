const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController, proxyShopifyConsultantPage, } = require('../Controller/shopifyController');

shopifyRoute.get('/install', installShopifyApp);
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);
shopifyRoute.get('/agora', proxyThemeAssetsController);
shopifyRoute.get('/agora/consultant-registration', proxyShopifyConsultantPage);
shopifyRoute.get("/agora/text", (req, res) => {
    res.send("Shopify App Proxy working ✅");
});


module.exports = shopifyRoute;
