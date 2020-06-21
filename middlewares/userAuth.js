'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var secret_key = '137955';

exports.authUser = function(req, res, next){
    if(!req.headers.authorization) return res.status(403).send({ message: 'No tienes autorización' });
    var token = req.headers.authorization.replace(/['"]+/g,'');

    try{
        var payload = jwt.decode(token, secret_key);
        if(payload.exp <= moment().unix()) return res.status(400).send({ message: 'Tu sesión a expirado' });
    } catch(ex){
        return res.status(400).send({ message: 'Tu autorización no es valida' });
    }

    req.user = payload;
    next();
}