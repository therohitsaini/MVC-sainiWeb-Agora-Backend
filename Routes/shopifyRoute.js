const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController,} = require('../Controller/shopifyController');


// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);
// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);

// Route: /theme/assets
shopifyRoute.get('/agora', proxyThemeAssetsController);

module.exports = shopifyRoute;
