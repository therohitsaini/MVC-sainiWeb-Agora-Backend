const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController, proxyShopifyConsultantPage, shopifyUserRegistrationController,} = require('../Controller/shopifyController');

// Middleware to preserve raw body for webhook HMAC verification
const rawBodyMiddleware = express.raw({ type: 'application/json' });

// Route: /shopify/install
shopifyRoute.get('/install', installShopifyApp);
// Route: /auth/callback
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);

// Route: /theme/assets
shopifyRoute.get('/agora', proxyThemeAssetsController);
// Route: /consultant-registration
shopifyRoute.get('/agora/consultant-registration', proxyShopifyConsultantPage);
// Webhook route with raw body middleware (must come before JSON parsing)
shopifyRoute.post('/webhooks/customers/create', rawBodyMiddleware, shopifyUserRegistrationController);

module.exports = shopifyRoute;
