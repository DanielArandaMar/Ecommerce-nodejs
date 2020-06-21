'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret_key = '137955';

exports.createToken = function(user){
    var payload = {
        sub: user._id,
        name: user.name,
        surname: user.surname,
        nickname: user.nickname,
        role: user.role,
        iat: moment().unix(),
        exp: moment().add(1,'days').unix()
    };

    return jwt.encode(payload, secret_key);
}