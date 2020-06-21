'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderSchema = Schema({
    user: {type: Schema.ObjectId, ref: 'User'},
    product: {type: Schema.ObjectId, ref: 'Product'},
    address: {type: Schema.ObjectId, ref: 'Address'},
    quantity: Number,
    total: Number,
    status: String,
    completed: Boolean,
    created_at: String
});

module.exports = mongoose.model('Oder', OrderSchema);