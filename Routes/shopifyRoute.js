const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController, proxyShopifyConsultantPage, shopifyUserRegistrationController,} = require('../Controller/shopifyController');


// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);
// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);

// Route: /theme/assets
shopifyRoute.get('/agora', proxyThemeAssetsController);
// Route: /consultant-registration
shopifyRoute.get('/agora/consultant-registration', proxyShopifyConsultantPage);
shopifyRoute.post('/webhooks/customers/create', shopifyUserRegistrationController);

module.exports = shopifyRoute;
