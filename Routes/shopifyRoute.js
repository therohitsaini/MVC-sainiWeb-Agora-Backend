const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, getProducts, redirectToAgora } = require('../Controller/shopifyController');


// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);

// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);

// Route: /products
shopifyRoute.get('/products', getProducts);

// Route: /redirect-to-agora
shopifyRoute.get('/agora', redirectToAgora);
module.exports = shopifyRoute;
