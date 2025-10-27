const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, getProducts } = require('../Controller/shopifyController');


// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);

// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);

// Route: /products
shopifyRoute.get('/products', getProducts);

module.exports = shopifyRoute;
