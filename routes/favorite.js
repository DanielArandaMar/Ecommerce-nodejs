'use strict'

var express = require('express');
var api = express.Router();

var FavoriteController = require('../controllers/favorite');
var md_auth = require('../middlewares/userAuth');

api.post('/save-my-favorite', md_auth.authUser, FavoriteController.saveFavorite);
api.get('/my-favorites', md_auth.authUser, FavoriteController.getMyFavorites);
api.delete('/delete-my-favorite/:productId', md_auth.authUser, FavoriteController.deleteMyFavorite);


module.exports = api;
