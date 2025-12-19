// router
const express = require('express');
const webHookRoute = express.Router();
const { webhooksOrdersCreated, webhooksOrdersDeleted } = require('../Controller/webHookController');

// Shopify webhooks must use raw body
webHookRoute.post('/webhooks/orders-created', express.raw({ type: "application/json" }), webhooksOrdersCreated);
webHookRoute.post('/webhooks/orders-deleted', express.raw({ type: "application/json" }), webhooksOrdersDeleted);

module.exports = { webHookRoute };
