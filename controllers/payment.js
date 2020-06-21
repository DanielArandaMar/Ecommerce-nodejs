'use strict'

var Order = require('../models/order');
var Address = require('../models/address');
var paypal = require('paypal-rest-sdk');

/* CONFIGURACION DE PAYPAL */
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'AZgwNS98qN8qd8SRIFa37Xs9olNqKWJRqbmH_tZB0ayuJrjhVcc0kbxZPlx2d31veefm9inLqJv2oFTP',
    'client_secret': 'EDTWieEzWR9PUoRFrrL1qDKOLk5I60tjs7zY4FFLVBHZLCdGhSMjuwI2qlLX09uHXUhMUtQMTUPUQg7F'
});


var controller = {
    
    // Creación del pago con paypal
    createPaypalPayment: function(req, res){
        
        
        // Verificar si su ubicacion de envio es valida 
        var userId = req.params.userId;

        if(userId != req.user.sub) return displayMessage(res, 403, 'Permiso denegado');

        Address.findOne({ user: userId }, (err, address) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!address) return displayMessage(res, 404, 'Dato no existente');

            if(address.verified == false) return displayMessage(res, 403, 'No puedes realizar la compra porque tu dirección de envio aún no ha sido confirmada');

            var params = req.body;
            var name = params.productName;
            var price = params.price;
            var total = params.total;
            var quantity = params.quantity;
    
    
            price = price.toString();
            total = total.toString();
            quantity = parseInt(quantity, 10);
    
    
    
              /* URLS DE REDIRECCION */
              var success_url = 'http://ecommerce.danielarandabriefcase.com/success';
              var cancel_url = 'http://ecommerce.danielarandabriefcase.com/cancel';
              /* URLS DE REDIRECCION */
      
      
              var create_payment_json = {
                  "intent": "sale",
                  "payer": {
                      "payment_method": "paypal"
                  },
                  "redirect_urls": {
                      "return_url": success_url,
                      "cancel_url": cancel_url
                  },
                  "transactions": [{
                      "item_list": {
                          "items": [{
                              "name": name,
                              "sku": name,
                              "price": price,
                              "currency": "MXN",
                              "quantity": quantity
                          }]
                      },
                      "amount": {
                          "currency": "MXN",
                          "total": total
                      },
                      "description": name
                  }]
              };
              
          
              paypal.payment.create(create_payment_json, function (error, payment) {
                  if (error) {
                      return displayMessage(res, 400, 'Algo salio mal :(');
                      throw error;
                  } else {
                     // console.log("Create Payment Response");
                     // console.log(payment);
                      var link = payment.links[1].href;
                      
                      // retorna el link para hacer el pago
                      return res.status(200).send({ paypal: link });
                  }
              });
        });
    
       
    },

    // Hacer la transacción del dinero a paypal
    makeTransaction: function(req, res){
        var params = req.params;

        var PayerID = params.payerId;
        var paymentId = params.paymentId;
        var total = params.total;
        total = total.toString();

        var execute_payment_json = {
            payer_id: PayerID,
            transactions: [
                {
                    amount: {
                        currency: "MXN",
                        total: total // modificar dependiendo del total
                    }
                }
            ]
        };
    
        paypal.payment.execute(paymentId, execute_payment_json, function(
            error,
            payment
        ) {
            if (error) {
                // console.log(error.response);
                throw error;
            } else {
                    // console.log("Get Payment Response");
                    // console.log(JSON.stringify(payment));
                return res.status(200).send({ payment });
            }
        });
    }


};

/* FUNCIONALIDADES EXTRAS */
function displayMessage(res, code, messageText){
    res.status(code).send({ message: messageText });
}

module.exports = controller;