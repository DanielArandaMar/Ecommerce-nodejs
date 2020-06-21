'use strict'
var moment = require('moment');
var paginate = require('mongoose-pagination');

var Order = require('../models/order');
var Product = require('../models/product');

var controller = {

    /* GUARDAR UNA ORDEN */
    saveOrder: function(req, res){
        var order = new Order();
        var params = req.body;

        order.user = req.user.sub;
        order.product = params.product;
        order.quantity = params.quantity;
        order.address = params.address;
        order.total = params.total;
        order.completed = false;
        order.status = 'pendiente';
        order.created_at = moment().unix();

        if(order.user != null && order.product !=  null
            && order.quantity != null && order.total != null 
            && order.status != null && order.created_at != null){
                
                /* COMPROBAR QUE HAY STOCK DISPONIBLE */
                var quantity = order.quantity;
                Product.findById(order.product, (err, product) => {
                    if(err) displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!product) return displayMessage(res, 404, 'EL producto no existe');
                   
                    var newQuantity = product.stock - quantity;
                   
                    // Comprobar que hay stock disponible
                    if(newQuantity  >= 0){
                        // Actualizar el stock del producto
                        Product.findByIdAndUpdate(order.product, {stock: newQuantity}, {new: true}, (err, updatedProduct) => {
                            if(err) displayMessage(res, 500, 'Se produjo un error en el servidor');
                            if(!updatedProduct) displayMessage(res, 404, 'Error interno. Vuelve a intentarlo');

                            // Guardar la orden en la base de datos
                            order.save((err, orderStored) => {
                                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                                if(!orderStored) return displayMessage(res, 404, 'Algo ocurrio mal. Vuelvelo a intentar');
                                return res.status(200).send({ order: orderStored });
                            });
                        });

                    } else {
                        return displayMessage(res, 400, 'Ya no hay unidades disponibles :(');
                    }
              
                });

               

            } else {
                return displayMessage(res, 400, 'Faltan datos pararealizar la operación');
            }
    },
    
    /* ACTUALIZAR SI LA TRANSACCIÓN FUE EXITOSA */
    updateOrderStatus: function(req, res){
        var orderId = req.params.orderId;
        Order.findByIdAndUpdate(orderId, { status: 'realizada' }, {new: true}, (err, updated) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!updated) return displayMessage(res, 404, 'Orden no actualizada');

            return res.status(200).send({ order: updated });
        });
    },

    /* ACTUALIZAR SI LA ORDEN FUE COMPLETADA */
    updatedOrderCompleted: function(req, res){
        var orderId = req.params.orderId;

        Order.findById(orderId, (err, order) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(order.completed == false){
                Order.findByIdAndUpdate(orderId, {completed: true}, {new: true}, (err, order) => {
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!order) return displayMessage(res, 404, 'Pedido no encontrado');
        
                    return res.status(200).send({ order });
                });
            } else if(order.completed == true){
                Order.findByIdAndUpdate(orderId, {completed: false}, {new: true}, (err, order) => {
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    if(!order) return displayMessage(res, 404, 'Pedido no encontrado');
        
                    return res.status(200).send({ order });
                });
            }
        });
        
    },

    /* OBTENER UNA ORDERN EN ESPECÍFICO */
    getOrderUser: function(req, res){
        var userId = req.params.userId;

        Order.findOne({ user: userId }).exec((err, order) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!order) return displayMessage(res, 404, 'Dato no existente');

            return res.status(200).send({ order });
        });
    },

    /* OBTENER LAS ORDENES DE UN USUARIO*/
    getOrdersUser: function(req, res){
        var userId = req.user.sub;

        Order.find({ user: userId }).populate(' product address ').exec((err, orders) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!orders) return displayMessage(res, 404, 'Dato no existente');

            return res.status(200).send({ orders });
        });
    },

    /* OBTENER LAS ORDENES TOTALES */
    getOrders: function(req, res){
        var page = 1;
        var items_per_page = 1;
        if(req.params.page){
            page = req.params.page;
        }
        
        Order.find().populate('user address product').sort('-created_at').paginate(page, items_per_page, (err, orders, total) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!orders) return displayMessage(res, 404, 'Dato no existente');

            return res.status(200).send({ 
                orders,
                items_per_page,
                total,
                page,
                pages: Math.ceil(total/items_per_page)
            });
        });
    },

    /* OBTENER LAS ORDENES TOTALES SIN PAGINACIÓN*/
    getOrdersNotPagination: function(req, res){
        Order.find().populate('user address product').sort('-created_at').exec((err, orders) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!orders) return displayMessage(res, 404, 'Dato no existente');

            return res.status(200).send({ 
                orders
            });
        });
    },

    /* OBTENER INFORMACION DE LA ORDEN */
    getOrderData: function(req, res){
        getOrderInfo().then((value) => {
            return res.status(200).send({
                totalIncomplete: value.totalIncomplete,
                totalComplete: value.totalComplete,
                incomplete: value.incomplete,
                completed: value.complete,
                incompleteIds: value.incompleteIds
            });
        });
    },

    /* BUSCAR UNA ORDER POR SU ID */
    searchOrder: function(req, res){
        var search = req.params.search;
            Order.find({_id: search}).populate('product user address').exec((err, orders) => {
                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                if(!orders) return displayMessage(res, 404, 'Algo salió mal. Vuelva a intentarlo más tarde');
    
                return res.status(200).send({ orders });
                
            });
    },

    // BORRAR UNA ORDEN POR SU ID
    deleteOrder: function(req, res){
        var orderId = req.params.id;

        Order.findByIdAndDelete(orderId, (err, deletedOrder) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!deletedOrder) return displayMessage(res, 404, 'No se encontro el dato');

            return res.status(200).send({ order: deletedOrder });
        });
    }
    

};



// FUNCIONALIDADES EXTRA

function displayMessage(res, code, messageText){
    res.status(code).send({ message: messageText });
}

async function getOrderInfo(){
    var incomplete = await Order.find({ completed: false }).populate('address user product').exec().then((orders) => {
        return orders;
    }).catch(err => {
        return handleError(err);
    });

    var complete = await Order.find({ completed: true }).exec().then((orders) => {
        return orders;
    }).catch(err => {
        return handleError(err);
    });

    var totalComplete = await Order.find({ completed: true }).exec().then((orders) => {
        return orders.length;
    }).catch(err => {
        return handleError(err);
    });

    var totalIncomplete = await Order.find({ completed: false }).exec().then((orders) => {
        return orders.length;
    }).catch(err => {
        return handleError(err);
    });

    var incompleteIds = await Order.find({ completed: false }).exec().then((orders) => {
        var ids = [];
        orders.forEach((order) => {
            ids.push(order._id);
        });
        return ids;
    });

    return {
        incomplete: incomplete,
        complete: complete,
        totalIncomplete: totalIncomplete,
        totalComplete: totalComplete,
        incompleteIds: incompleteIds
    }
}



module.exports = controller;