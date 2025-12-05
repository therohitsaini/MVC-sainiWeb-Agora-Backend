const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController, proxyShopifyConsultantPage, proxyShopifyConsultantLoginPage, proxySHopifyConsultantChat, proxyShopifyUserChat        } = require('../Controller/shopifyController');
const { deleteConsultant } = require('../Controller/consultantController');
// Original route (Shopify automatically hit karta hai - MUST KEEP THIS!)
shopifyRoute.get('/install', installShopifyApp);
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);
shopifyRoute.get('/consultant-theme', proxyThemeAssetsController);
shopifyRoute.get('/consultant-theme/login', proxyShopifyConsultantPage);
shopifyRoute.get('/consultant-theme/consultant-dashboard', proxyShopifyConsultantLoginPage);
shopifyRoute.get('/consultant-theme/chats', proxySHopifyConsultantChat);
shopifyRoute.get('/consultant-theme/view-profile', proxyShopifyViewProfile);
shopifyRoute.get('/consultant-theme/chats-c', proxyShopifyChatSection);


module.exports = shopifyRoute;
