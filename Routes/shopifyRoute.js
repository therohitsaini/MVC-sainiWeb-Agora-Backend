const express = require('express');
const shopifyRoute = express.Router();
const { installShopifyApp,
    authCallback,
    appIsInstalled,
    proxyThemeAssetsController,
    proxyShopifyConsultantPage,
    proxyShopifyConsultantLoginPage,
    proxySHopifyConsultantChat,
    proxyShopifyViewProfile,
    proxyShopifyChatSection,
    proxyProfileSection,
    proxyShopifyCallAccepted
} = require('../Controller/shopifyController');
const { deleteConsultant } = require('../Controller/consultantController');
// Original route (Shopify automatically hit karta hai - MUST KEEP THIS!)
shopifyRoute.get('/install/:shop', installShopifyApp);
shopifyRoute.get('/callback', authCallback);
// shopifyRoute.get('/login', shopifyLogin);
shopifyRoute.get('/consultant-theme', proxyThemeAssetsController);
shopifyRoute.get('/consultant-theme/login', proxyShopifyConsultantPage);
shopifyRoute.get('/consultant-theme/consultant-dashboard', proxyShopifyConsultantLoginPage);
shopifyRoute.get('/consultant-theme/consultant-chats-section', proxySHopifyConsultantChat);
shopifyRoute.get('/consultant-theme/view-profile', proxyShopifyViewProfile);
shopifyRoute.get('/consultant-theme/chats-c', proxyShopifyChatSection);
shopifyRoute.get('/consultant-theme/profile', proxyProfileSection);
shopifyRoute.get('/consultant-theme/video-calling-page', proxyShopifyCallAccepted);
shopifyRoute.get('/app/is-installed/:shop', appIsInstalled);
module.exports = shopifyRoute;
