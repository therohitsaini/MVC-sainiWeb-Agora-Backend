const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, getThemeHeader, getThemeFooter } = require('../Controller/shopifyController');


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

// Theme assets: header/footer
shopifyRoute.get('/theme/header', getThemeHeader);
shopifyRoute.get('/theme/footer', getThemeFooter);
module.exports = shopifyRoute;
