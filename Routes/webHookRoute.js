const express = require('express');
const webHookRoute = express.Router();
const { webhooksOrdersCreated,  } = require('../Controller/webHookController');
webHookRoute.use(express.json());

webHookRoute.post('/webhooks/orders-created', webhooksOrdersCreated);
// webHookRoute.post('/webhooks/orders-deleted', webhooksOrdersDeleted);

module.exports = { webHookRoute };