const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp, authCallback, shopifyLogin, proxyThemeAssetsController, proxyShopifyConsultantPage, proxyShopifyConsultantLoginPage, proxySHopifyConsultantChat, proxyShopifyViewProfile, proxyShopifyChatSection        } = require('../Controller/shopifyController');
const { deleteConsultant } = require('../Controller/consultantController');
// Original route (Shopify automatically hit karta hai - MUST KEEP THIS!)
shopifyRoute.get('/install', installShopifyApp);
shopifyRoute.get('/callback', authCallback);
shopifyRoute.get('/login', shopifyLogin);
shopifyRoute.get('/home', proxyThemeAssetsController);
shopifyRoute.get('/home/login', proxyShopifyConsultantPage);
shopifyRoute.get('/home/consultant-dashboard', proxyShopifyConsultantLoginPage);
shopifyRoute.get('/home/consultant-chats-section', proxySHopifyConsultantChat);
shopifyRoute.get('/home/view-profile', proxyShopifyViewProfile);
shopifyRoute.get('/home/chats-c', proxyShopifyChatSection);


module.exports = shopifyRoute;
