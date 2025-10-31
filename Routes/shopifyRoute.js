const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin,} = require('../Controller/shopifyController');


// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);

// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);

// // Route: /products
// shopifyRoute.get('/products', getProducts);

// // Route: /redirect-to-agora
// shopifyRoute.get('/agora', redirectToAgora);

// Route: /login (validate Shopify signed params, issue JWT, redirect)
shopifyRoute.get('/login', shopifyLogin);


module.exports = shopifyRoute;
