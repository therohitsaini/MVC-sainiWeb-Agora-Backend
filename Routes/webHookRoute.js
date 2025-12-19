const express = require('express');
const webHookRoute = express.Router();
const { webhooksOrdersPaid } = require('../Controller/webHookController');
webHookRoute.use(express.json());

webHookRoute.post('/webhooks/orders-paid', webhooksOrdersPaid);

module.exports = { webHookRoute };