const express = require('express');
const webHookRoute = express.Router();
const { webhooksOrdersCreated, webhooksOrdersDeleted } = require('../Controller/webHookController');
webHookRoute.use(express.json());

webHookRoute.post('/webhooks/orders-created', express.raw({ type: "application/json" }), webhooksOrdersCreated);
webHookRoute.post('/webhooks/orders-deleted', express.raw({ type: "application/json" }), webhooksOrdersDeleted);

module.exports = { webHookRoute };