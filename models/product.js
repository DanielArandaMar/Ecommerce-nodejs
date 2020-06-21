'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProductSchema = Schema({
    title: String,
    description: String,
    price: Number,
    status: String,
    image: String,
    stock: Number,
    created_at: String
});

module.exports = mongoose.model('Product', ProductSchema);