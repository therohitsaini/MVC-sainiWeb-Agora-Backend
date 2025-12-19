const express = require('express');
const { createDraftOrder } = require('../Controller/shopifyDraftOrderController');
const shopifyDraftOrderRoute = express.Router();

shopifyDraftOrderRoute.post('/create-draft-order', createDraftOrder);
shopifyDraftOrderRoute.post('/webhooks/orders-paid', webhooksOrdersPaid);
module.exports = { shopifyDraftOrderRoute };