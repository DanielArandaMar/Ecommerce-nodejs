'use strict'

var express = require('express');
var api = express.Router();

var UserController = require('../controllers/user');
var md_auth = require('../middlewares/userAuth');
var md_auth_admin = require('../middlewares/adminAuth');

// RUTAS PARA EL USUARIO EN GENERAL
api.post('/register-user', UserController.register);
api.post('/login-user', UserController.login);
api.get('/user-data', md_auth.authUser, UserController.getUser);
api.put('/update-user-data', md_auth.authUser, UserController.updateUser);
api.put('/user-update-general-data', md_auth.authUser, UserController.updateGeneralData);
api.put('/user-update-password', md_auth.authUser, UserController.updatePasswordUser);

// RUTAS DE DOMICILIO 
api.put('/user-update-address/:addressId', md_auth.authUser, UserController.updateAddress);
api.get('/not-verified-addresses', md_auth_admin.authAdmin, UserController.getNotverifiesAdresses);
api.get('/address-user', md_auth.authUser, UserController.getAddressUser);
api.get('/search-address/:search', md_auth_admin.authAdmin, UserController.searchAddress);
api.put('/update-verify-address/:addressId', md_auth_admin.authAdmin, UserController.updateAddress);

// RUTAS DE PRUEBA
api.get('/zip-code', UserController.testing);

module.exports = api;