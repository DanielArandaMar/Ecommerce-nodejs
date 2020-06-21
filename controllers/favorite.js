'use strict'
var moment = require('moment');
var Favorite = require('../models/favorite');

var controller = {

    /* CREAR UN NUEVO FAVORTIO PARA EL USUARIO */
    saveFavorite: function(req, res){
        var params = req.body;
        var favorite = new Favorite();

        favorite.user = req.user.sub;
        favorite.product = params.product;
        favorite.created_at = moment().unix();

        favorite.save((err, saved) => {
            if(err) displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!saved) displayMessage(res, 404, 'Dato no guardado');

            return res.status(200).send({ favorite: saved })
        });
        
    },
    /* CREAR UN NUEVO FAVORTIO PARA EL USUARIO */


    /* ENCONTRAR MIS FAVORITOS */
    getMyFavorites: function(req, res){
        var userId = req.user.sub;

        Favorite.find({ user: userId }).populate('product').sort('-created_at').exec((err, favorites) => {
            if(err) displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!favorites) displayMessage(res, 404, 'Datos no encontrados');


            return res.status(200).send({ 
                favorites: favorites
             });
        });
    },
    /* ENCONTRAR MIS FAVORITOS */
    

    /* BORRAR DE FAVORITOS */
    deleteMyFavorite: function(req, res){
        var productId = req.params.productId;
        Favorite.findOne({ user: req.user.sub }, (err, user) => {
            if(user._id = req.user.sub){
                // Borrar de mis favoritos
                Favorite.findOneAndRemove({ product: productId }, (err, deleted) => {
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!deleted) return displayMessage(res, 404, 'Dato no encontrado');
                   
                    return res.status(200).send({ 
                        favorite: deleted
                     });
                });

            } else {
                return displayMessage(res, 403, 'Permiso denegado');
            }
        });
    }
    /* BORRAR DE FAVORITOS */


};


/* FUNCIONALIDADES EXTRAS */
function displayMessage(res, code, messageText){
    res.status(code).send({ message: messageText });
}

module.exports = controller;

