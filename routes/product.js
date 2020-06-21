'use strict'

var express = require('express');
var api = express.Router();
var connectMulti = require('connect-multiparty');

var ProductController = require('../controllers/product');
var md_auth_admin = require('../middlewares/adminAuth');
var md_auth_user = require('../middlewares/userAuth');
var md_upload = connectMulti({ uploadDir: './uploads/products' });

api.post('/create-new-product', md_auth_admin.authAdmin, ProductController.createProduct);
api.post('/upload-image-product/:id', [md_auth_admin.authAdmin, md_upload], ProductController.uploadImage);
api.get('/products', ProductController.getProducts);
api.get('/products-token', md_auth_user.authUser, ProductController.getProductsToken);
api.get('/product/:id', ProductController.getProduct);
api.get('/get-image-product/:imageFile', ProductController.getImage);
api.put('/update-product/:id', md_auth_admin.authAdmin, ProductController.updateProduct);
api.delete('/delete-product/:id', md_auth_admin.authAdmin, ProductController.deleteProduct);
api.get('/search-products/:search', ProductController.searchProducts);

module.exports = api;
