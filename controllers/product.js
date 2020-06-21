'use strict'

var moment = require('moment');
var fs = require('fs');
var path = require('path');

var Product = require('../models/product');
var Favorite = require('../models/favorite');
var Order = require('../models/order');

var controller = {

    /* CREAR UN NUEVO PRODUCTO */
    createProduct: function(req, res){
        var params = req.body;
        var product = new Product();

        product.title = params.title;                                           
        product.description = params.description;
        product.price = params.price;                   
        product.status = params.status;
        product.stock = params.stock;
        product.image = params.image;
        product.created_at = moment().unix();

        if(product.title != null && product.description != null 
            && product.price != null && product.status != null
            && product.stock != null && product.created_at != null){

                if(product.description.length < 20) return displayMessage(res, 400, 'Cuidado, la descripsión debe ser mayor a 20 caracteres');

                product.save((err, productStored) => {
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!productStored) return displayMessage(res, 404, 'Fallo al guardar el nuevo producto');

                    return res.status(200).send({ product: productStored });
                });

            } else {
                return displayMessage(res, 400, 'Ingresa todos los datos');
            }

    },
   
    /* OBETNER TODOS LOS PRODUCTOS */
    getProducts: function(req, res){
        Product.find().sort('-created_at').exec((err, products) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!products) return displayMessage(res, 404, 'Productos no encontrados');

            return res.status(200).send({ products });
        });
    },

    /* OBTENER LOS PRODUCTOS CON IDENTIFICACION */
    getProductsToken: function(req, res){
        var userId = req.user.sub;
       getproductsAndMyfavorites(userId).then((value) => {
            return res.status(200).send({
                products: value.products,
                favoritesProducts: value.favoritesProducts
            });
       });
    },
   
     /* OBETNER UN SOLO PRODUCTO */
    getProduct: function(req, res){
        var productid = req.params.id;
        Product.findById(productid, (err, product) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!product) return displayMessage(res, 404, 'Productos no encontrados');

            return res.status(200).send({ product });
        });
    },
    
    /* ACTUALIZA EL PROUCTO */
    updateProduct: function(req, res){
        var productId = req.params.id; 
        var update = req.body;

        Product.findByIdAndUpdate(productId, update, {new: true}, (err, updatedProduct) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!updatedProduct) return displayMessage(res, 404, 'Dato no existente');

            return res.status(200).send({ product: updatedProduct });
        });
    },
    
    /* SUBIR UNA IMAGEN */
    uploadImage: function(req, res){
        var productId = req.params.id;
        
        if(req.files){
            var file_path = req.files.image.path;
            var split_path = file_path.split('/');
            var image_name = split_path[2];

            var ext_split = image_name.split('\.');
            var ext = ext_split[1];
           
            if(ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif' || ext == 'webp'){
                Product.findByIdAndUpdate(productId, { image: image_name }, {new: true}, (err, updateProduct) => {
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!updateProduct) return displayMessage(res, 404, 'Dato no existente');

                    return res.status(200).send({ product: updateProduct });
                });
            } else {
                removeUpload(res, file_path, 'Extensión no valida');
            }
        } else {
            return res.status(400).send({ message: 'No haz seleccionado una imagen' });
        }

    },
    
    /* OBETENER LA IMAGEN */
    getImage: function(req, res){
        var imageName = req.params.imageFile;
        var file_path = 'uploads/products/' + imageName;

        fs.exists(file_path, (exists) => {
            if(exists){
                return res.sendFile(path.resolve(file_path));
            } else {
                return res.status(404).send({ message: 'Imagen no existente' });
            }
        });
    },

    /* ELIMINAR UN PRODUCTO */
    deleteProduct: function(req, res){
        var productId = req.params.id;
        Order.find({ product: productId }).exec((err, order) => {
            if(err) return displayMessage(res, 500, 'Se prodijo un error en el servidor');
            if(!order) return displayMessage(res, 404, 'Orden no existente');

            if(order.length == 0){
                Favorite.find({ product: productId }).remove((err, favoriteRemoved) => {
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!favoriteRemoved) return displayMessage(res, 404, 'Favorito no existente');
                    
                    Product.findByIdAndDelete(productId, (err, productDeleted) => {
                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                        if(!productDeleted) return displayMessage(res, 404, 'Producto no existente');
    
                        return res.status(200).send({ product: productDeleted });
                    });
                });
               
            } else {
                return displayMessage(res, 400, 'El producto esta sometido a un pedido');
            }
        });
        
    },

    /* BUSCADOR DE PRODUCTOS */
    searchProducts: function(req, res){
        var search = req.params.search;

        var split_search = search.split(' ');
        var search1 = split_search[0];
        var search2 = split_search[1];

        var search1Upper = capitalize(search1);
        var search2Upper = search2;
        if(search2Upper != undefined) capitalize(search2);

        const pipe = {
            '$or': [
                {
                    'title': {
                        '$regex': '.*' + search1Upper + '.*'
                    }
                },
                {
                    'title': {
                        '$regex': '.*' + search2Upper + '.*'
                    }
                }
            ]
        };

        Product.find(pipe).sort('-created_at').exec((err, products) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!products) return displayMessage(res, 400, 'No hay resultados');

            return res.status(200).send({ products });
        });
    }

    
};

/* FUNCIONALIDADES EXTRAS */
function displayMessage(res, code, messageText){
    res.status(code).send({ message: messageText });
}

function removeUpload(res, path_file,  message){
    fs.unlink(path_file, (err) => {
        return res.status(400).send({ message: message });
    });
}

async function getproductsAndMyfavorites(userId){

    var products = await Product.find().sort('-created_at').exec().then((products) => {
       return products;
    }).catch((err) => {
        return handleError(err);
    });

    var myFavorites = await Favorite.find({ user: userId }).sort('-created_at').exec().then((favorites) => {
        var productsId = [];
        favorites.forEach((favorite) => {
            productsId.push(favorite.product);
        });
        return productsId;
    }).catch((err) => {
        return handleError(err);
    })

    return {
        products: products,
        favoritesProducts: myFavorites
    };
}

// Hacer mayusculas la primera letra de una palabra
function capitalize(word){
	return word[0].toUpperCase() + word.slice(1);
}




module.exports = controller;
