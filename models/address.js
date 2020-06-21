'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AddressSchema = Schema({
    user: {type: Schema.ObjectId, ref: 'User'},
    zipCode: Number,
    country: String,
    state: String,
    city: String,
    verified: Boolean,
    street: String,
    suburb: String,
    externalN: Number,
    internalN: Number,
    street1: String,
    street2: String,
    phone: Number

});

module.exports = mongoose.model('Address', AddressSchema);