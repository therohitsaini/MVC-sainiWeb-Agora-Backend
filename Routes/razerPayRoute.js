const express = require('express');
const { createOrderController, verifyPaymentController } = require('../Controller/razerPayController');
const razerPayRoute = express.Router();


razerPayRoute.post("/create-order", createOrderController);
razerPayRoute.post("/verify-payment", verifyPaymentController);

module.exports = { razerPayRoute };