'use strict'

var express = require('express');
var body_parser = require('body-parser');
var path = require('path');
var fs = require('fs');
var app = express();

// DEFINICION DE LAS RUTAS DEL API
var user_routes = require('./routes/user');
var product_routes = require('./routes/product');
var favorite_routes = require('./routes/favorite');
var payment_routes = require('./routes/payment');
var order_routes = require('./routes/order');

// MIDDLEWARES ESCENCIALES PARA BODY PARSER
app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());
// MIDDLEWARES ESCENCIALES PARA BODY PARSER


// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
// CORS


// MIDDLEWARES PARA LAS RUTAS
app.use('/', express.static('client', {redirect: false}));
app.use('/api', user_routes);
app.use('/api', product_routes);
app.use('/api', favorite_routes);
app.use('/api', payment_routes);
app.use('/api', order_routes);
app.get('*', function(req, res, next){
	res.sendFile(path.resolve('client/index.html'));
});

// EXPORTAR
module.exports = app;
// EXPORTAR