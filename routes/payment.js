'use strict'

var express = require('express');
var api = express.Router();

var PaymentController = require('../controllers/payment');
var md_auth_user = require('../middlewares/userAuth');

api.post('/create-paypal-payment/:userId', md_auth_user.authUser, PaymentController.createPaypalPayment);
api.get('/make-paypal-transaction/:payerId/:paymentId/:total', md_auth_user.authUser, PaymentController.makeTransaction);


module.exports = api;