// router
const express = require('express');
const webHookRoute = express.Router();
const { webhooksOrdersCreated, webhooksOrdersDeleted, webhooksAppUninstalled } = require('../Controller/webHookController');
const { verifyWebhook } = require('../MiddleWare/ShopifyMiddleware/verifyWebHook');

// Shopify webhooks must use raw body
// express.raw() must be first to preserve the raw body for HMAC verification
webHookRoute.post('/webhooks/orders-created', express.raw({ type: "application/json" }), verifyWebhook, webhooksOrdersCreated);
webHookRoute.post('/webhooks/orders-deleted', express.raw({ type: "application/json" }), verifyWebhook, webhooksOrdersDeleted);
webHookRoute.post('/app-uninstalled', express.raw({ type: "application/json" }), verifyWebhook, webhooksAppUninstalled);

module.exports = { webHookRoute };
