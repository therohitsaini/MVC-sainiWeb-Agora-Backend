const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController, proxyShopifyConsultantPage, } = require('../Controller/shopifyController');
const { deleteConsultant } = require('../Controller/consultantController');
// Original route (Shopify automatically hit karta hai - MUST KEEP THIS!)
shopifyRoute.get('/install', installShopifyApp);
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);
shopifyRoute.get('/consultant-theme', proxyThemeAssetsController);
shopifyRoute.get('/consultant-theme/login', proxyShopifyConsultantPage);


module.exports = shopifyRoute;
