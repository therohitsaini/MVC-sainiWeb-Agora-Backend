const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback } = require('../Controller/shopifyController');


// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);

// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);

module.exports = shopifyRoute;
