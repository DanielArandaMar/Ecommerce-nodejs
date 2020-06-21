'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = process.env.PORT || 3700;

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/ecommerce-practice')
    .then(() => {
        console.log(' -> SUCCESS CONNECTION TO DATABASE');

        //INICIALIZAR EL SERVIDOR
        app.listen(port, () => {
            console.log(' -> SERVER RUNING AT http://localhost:3700');
        });
        //INICIALIZAR EL SERVIDOR
    })
    .catch(err => {
        console.log(err);
    });
