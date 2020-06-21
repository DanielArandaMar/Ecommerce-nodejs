'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FavoriteSchema = Schema({
    product: {type: Schema.ObjectId, ref: 'Product'},
    user: {type: Schema.ObjectId, ref: 'User'},
    created_at: String
});

module.exports = mongoose.model('Favorite', FavoriteSchema);