const express = require('express');
const shopifyController = require('./shopifyController');
const shopifyRoute = express.Router();


shopifyRoute.post('/install', shopifyController.createOrder);

module.exports = shopifyRoute;