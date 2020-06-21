'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
    name: String,
    surname: String,
    nickname: String,
    role: String,
    password: String
});

module.exports = mongoose.model('User', UserSchema);