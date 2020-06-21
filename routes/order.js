'use strict'

var express = require('express');
var api = express.Router();

var OrderController = require('../controllers/order');
var md_auth_user = require('../middlewares/userAuth');
var md_auth_admin = require('../middlewares/adminAuth');

api.post('/save-order', md_auth_user.authUser, OrderController.saveOrder);
api.put('/update-order-status/:orderId', md_auth_user.authUser, OrderController.updateOrderStatus);
api.get('/order-user/:userId', md_auth_user.authUser, OrderController.getOrderUser);
api.get('/orders-user', md_auth_user.authUser, OrderController.getOrdersUser);
api.put('/update-order-completed/:orderId', md_auth_admin.authAdmin, OrderController.updatedOrderCompleted);
api.get('/orders/:page?', md_auth_admin.authAdmin, OrderController.getOrders);
api.get('/orders-not-pagination', md_auth_admin.authAdmin, OrderController.getOrdersNotPagination);
api.get('/order-data', md_auth_admin.authAdmin, OrderController.getOrderData);
api.get('/search-order/:search', md_auth_admin.authAdmin, OrderController.searchOrder);
api.delete('/delete-order/:id', md_auth_admin.authAdmin, OrderController.deleteOrder);

module.exports = api;