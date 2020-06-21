'use strict'

var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/create-jwt');
var unirest = require('unirest');

var User = require('../models/user');
var Address = require('../models/address');

var controller = {
    

    /* REGISTRO DEL USUARIO */
    register: function(req, res){
        var params = req.body;
        var user = new User();

        user.name = params.name;
        user.surname = params.surname;
        user.nickname = params.nickname;
        user.password = params.password;
        user.role = 'ROLE_USER';

        if(user.name != null && user.surname != null
        && user.nickname != null && user.password != null ){

            // Verificar que aceptó los terminos y condiciones
            if(params.terms == null) return displayMessage(res, 400, 'Acepta los términos y condiciones');

            // Verificar si el nombre de usuario es valido
            var correctNick = correctNickname(user.nickname);
            if(!correctNick) return displayMessage(res, 404, 'Nombre de usuario incorrecto');
            // Verificar si el nombre de usuario es valido


            // Verificar que la cuenta no ha sido ya registrada
            user.nickname = user.nickname.toLowerCase();
            User.find({ nickname: user.nickname }, (err, users) => {
                if(users.length >= 1) return displayMessage(res, 400, 'Este nombre de usuario ya ha sido utilizado');
                
                // Verificación de la contraseña
                if(user.password.length < 6) return displayMessage(res, 400, 'La contraseña debe de tener 6 caracteres mínimo');

                // Encriptación de la contraseña
                bcrypt.hash(user.password, null, null, (err, hash) =>{
                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                    user.password = hash;

                    // Guardar usuario en la base de datos
                    user.save((err, userSaved) => {
                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                        if(!userSaved) return displayMessage(res, 404, 'Registro fallido. Vuelve a intentarlo más tarde.');

                        // Guardar su direcciónn vacia
                        var address = new Address();
                        address.user = userSaved._id;
                        address.verified = false; // Dirección todavía no aprobada
                        address.save((err, addressStored) => {
                            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                            if(!addressStored) return displayMessage(res, 404, 'Registro fallido. Vuelve a intentarlo más tarde.');

                            user.password = undefined;
                            return res.status(200).send({ user: userSaved });
                        });
                        
                    });
                });
                // Encriptación de la contraseña

            });
            // Verificar que la cuenta no ha sido ya registrada
        
        } else {
            return displayMessage(res, 400, 'Ingresa todos los datos');
        }
    },
   
    /* IDENTIFICAR AL USUARIO */
    login: function(req, res){
        var params = req.body;
        
        var nickname = params.nickname.toLowerCase();
        var password = params.password;

        User.findOne({ 'nickname': nickname }, (err, user) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!user) return displayMessage(res, 400, 'Nombre de usuario y contraseña incorrectos');

            bcrypt.compare(password, user.password,(err, check) => {
                if(check){
                    if(params.hash){
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        });
                    } else {
                        return res.status(200).send({ user });
                    }
                } else {
                    return displayMessage(res, 400, 'Nombre de usuario y contraseña incorrectos');
                }
            });
        });
    },

    /* ACTUALIZAR DATOS GENERALES */
    updateGeneralData: function(req, res){
        var userId = req.user.sub;
        var update = req.body;
        delete update.password;

        // Validar nombre de usuario
        User.find({ nickname: update.nickname }).exec((err, users) => {
            var users_clean = [];
           users.forEach((user) => {
                if(user._id != userId){
                    users_clean.push(user);
                }
           });

           if(users_clean.length > 0) return displayMessage(res, 400, 'El nombre de usuario ya ha sido tomado');
           update.nickname = update.nickname.toLowerCase();
            // Actualizar al usuario
            User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated) => {
                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                if(!userUpdated) return displayMessage(res, 404, 'Dato no existente');

                return res.status(200).send({ user: userUpdated });
            });

        });

       
        
    },
    
    /* ACTUALIZAR DATOS DEL USUARIO */
    updateUser: function(req, res){
        var userId = req.user.sub;
       
        var params = req.body;
        delete params.password;

        // Si cambio su nombre de usuario
        if(params.nickname != req.user.nickname){
            params.nickname = params.nickname.toLowerCase();
        
            User.find({ nickname: params.nickname }, (err, users) => {
               if(users.length >= 1) return displayMessage(res, 400, 'Nombre de usuario ya en uso');

               User.findByIdAndUpdate(userId, params, {new: true}, (err, userUpdated) => {
                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                if(params.city != null || params.state != null || params.country != null || params.direction1 != null || params.direction2 != null){
                    params.verified = false;
                    if(params.city != null) params.city = params.city.toLowerCase();
                    if(params.state != null) params.state = params.state.toLowerCase();
                    if(params.country != null) params.country = params.country.toLowerCase();
    
                    Address.findOneAndUpdate({user: userId}, params, {new: true}, (err, addressUpdated) => {
                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
    
                        if(params.oldPassword != null && params.newPassword != null){
                            var actualPassword = params.oldPassword;
                            var newPassword = params.newPassword;
    
                            bcrypt.compare(actualPassword, userUpdated.password, (err, check) => {
                                if(check){
                                    // Actualizamos la contraseña
                                    bcrypt.hash(newPassword, null, null, (err, hash) => {
                                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
    
                                        newPassword = hash;
    
                                        User.findByIdAndUpdate(userId,{ password: newPassword }, {new: true}, (err, userUpdated) => {
                                            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                                            return res.status(200).send({
                                                userPassword: 'Haz cambiado tu contraseña',
                                                user: userUpdated,
                                                address: addressUpdated
                                            });
                                        });
                                    });
                                    
                                } else {
                                    // Contraseña incorrecta
                                    return res.status(200).send({
                                        message: 'Contraseña incorrecta',
                                        user: userUpdated,
                                        address: addressUpdated
                                    });
                                }
                            });
                        } else {
                            return res.status(200).send({
                                user: userUpdated,
                                address: addressUpdated
                            });
                        }
                    });
                } else {
                    if(params.oldPassword != null && params.newPassword != null){
                        var actualPassword = params.oldPassword;
                        var newPassword = params.newPassword;
    
                        bcrypt.compare(actualPassword, userUpdated.password, (err, check) => {
                            if(check){
                                // Actualizamos la contraseña
                                bcrypt.hash(newPassword, null, null, (err, hash) => {
                                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
    
                                    newPassword = hash;
    
                                    User.findByIdAndUpdate(userId,{ password: newPassword }, {new: true}, (err, userUpdated) => {
                                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                                        return res.status(200).send({
                                            userPassword: 'Haz cambiado tu contraseña',
                                            user: userUpdated
                                        });
                                    });
                                });
                                
                            } else {
                                // Contraseña incorrecta
                                return res.status(200).send({
                                    message: 'Contraseña incorrecta',
                                    user: userUpdated
                                });
                            }
                        });
                    } else {
                        return res.status(200).send({
                            user: userUpdated
                        });
                    }
                }
    
            });


            });

        } else {
            // Si no cambió su nombre de usuario
            User.findByIdAndUpdate(userId, params, {new: true}, (err, userUpdated) => {
                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                if(params.city != null || params.state != null || params.country != null || params.direction1 != null || params.direction2 != null){
                    params.verified = false;
                    if(params.city != null) params.city = params.city.toLowerCase();
                    if(params.state != null) params.state = params.state.toLowerCase();
                    if(params.country != null) params.country = params.country.toLowerCase();
    
                    Address.findOneAndUpdate({user: userId}, params, {new: true}, (err, addressUpdated) => {
                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
    
                        if(params.oldPassword != null && params.newPassword != null){
                            var actualPassword = params.oldPassword;
                            var newPassword = params.newPassword;
    
                            bcrypt.compare(actualPassword, userUpdated.password, (err, check) => {
                                if(check){
                                    // Actualizamos la contraseña
                                    bcrypt.hash(newPassword, null, null, (err, hash) => {
                                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
    
                                        newPassword = hash;
    
                                        User.findByIdAndUpdate(userId,{ password: newPassword }, {new: true}, (err, userUpdated) => {
                                            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                                            return res.status(200).send({
                                                userPassword: 'Haz cambiado tu contraseña',
                                                user: userUpdated,
                                                address: addressUpdated
                                            });
                                        });
                                    });
                                    
                                } else {
                                    // Contraseña incorrecta
                                    return res.status(200).send({
                                        message: 'Contraseña incorrecta',
                                        user: userUpdated,
                                        address: addressUpdated
                                    });
                                }
                            });
                        } else {
                            return res.status(200).send({
                                user: userUpdated,
                                address: addressUpdated
                            });
                        }
                    });
                } else {
                    if(params.oldPassword != null && params.newPassword != null){
                        var actualPassword = params.oldPassword;
                        var newPassword = params.newPassword;
    
                        bcrypt.compare(actualPassword, userUpdated.password, (err, check) => {
                            if(check){
                                // Actualizamos la contraseña
                                bcrypt.hash(newPassword, null, null, (err, hash) => {
                                    if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
    
                                    newPassword = hash;
    
                                    User.findByIdAndUpdate(userId,{ password: newPassword }, {new: true}, (err, userUpdated) => {
                                        if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                                        return res.status(200).send({
                                            userPassword: 'Haz cambiado tu contraseña',
                                            user: userUpdated
                                        });
                                    });
                                });
                                
                            } else {
                                // Contraseña incorrecta
                                return res.status(200).send({
                                    message: 'Contraseña incorrecta',
                                    user: userUpdated
                                });
                            }
                        });
                    } else {
                        return res.status(200).send({
                            user: userUpdated
                        });
                    }
                }
    
            });

        }

      
        

    },

    /* ACTUALIZAR LA CONTRASEÑA */
    updatePasswordUser: function(req, res){
        var userId = req.user.sub;
        var oldPassword = req.body.oldPassword;
        var newPassword = req.body.newPassword;

        User.findById(userId, (err, user) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!user) return displayMessage(res, 404, 'Dato no existente');

            bcrypt.compare(oldPassword, user.password,(err, check) =>{
                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                if(check){
                    bcrypt.hash(newPassword, null, null, (err, hash) => {
                        newPassword = hash;

                        User.findByIdAndUpdate(userId, {password: newPassword}, {new: true}, (err, userUpdated) => {
                            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                            if(!userUpdated) return displayMessage(res, 404, 'No se ha podido actualizar la contraseña');

                            return res.status(200).send({ user: userUpdated });
                        });
                    });
                } else {
                    return displayMessage(res, 400, 'Contraseña incorrecta');
                }
            });
        });

    },

    /* ACTUALIZAR LA DIRECCION DE DOMICILIO */
    updateAddress: function(req, res){
        var userId = req.user.sub;
        var addressId = req.params.addressId;
        var update = req.body;

        if(update.country != null) update.country = update.country.toLowerCase();
        if(update.state  != null) update.state = update.state.toLowerCase();
        if(update.city  != null) update.city = update.city.toLowerCase();
        if(update.street  != null) update.street = update.street.toLowerCase();
        if(update.suburb  != null) update.suburb = update.suburb.toLowerCase();
        if(update.street1  != null) update.street1 = update.street1.toLowerCase();
        if(update.street2  != null) update.street2 = update.street2.toLowerCase();

        update.verified = false;
        
       Address.findByIdAndUpdate(addressId, update, {new: true}, (err, updatedAddress) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!updatedAddress) return displayMessage(res, 404, 'Algo salió mal. Vuelve a intentarlo de nuevo');
            if(updatedAddress.user != userId) return displayMessage(res, 403, 'Permiso denegado');

            return res.status(200).send({ address: updatedAddress });
       });
    },

    /* OBTENER INFORMACION DEL USUARIO */
    getUser: function(req, res){
        var userId = req.user.sub;

       getDataUser(userId).then((value) => {
            return res.status(200).send({
                user: value.user,
                address: value.address
            });
       });
    },

    // OBETNER LA DIRECCION DEL USUARIO
    getAddressUser: function(req, res){
        var userId = req.user.sub;

        Address.findOne({ user: userId },(err, address) => {
            if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
            if(!address) return displayMessage(res, 404, 'Dato no existente');

            return res.status(200).send({ address });
        });
    },

    // PROBANDO VERIFICACIÓN DE ZIP CODE
    testing: function(req, res){

        var req = unirest("GET", "https://mexico-zip-codes.p.rapidapi.com/buscar/");
        
        req.query({
            "codigo_postal": "646"
        });
        
        req.headers({
            "x-rapidapi-host": "mexico-zip-codes.p.rapidapi.com",
            "x-rapidapi-key": "d0fab726ecmsh59a700ba4af1215p196abajsnd16aceeea975",
            "useQueryString": true
        });
        
        
        req.end(function (res) {
            if (res.error){
                console.log(res.error);
                throw new Error(res.error);
            } 
        
            console.log(res.body);
        });
    },

    // OBTENER TODAS LAS DIRECCIONES SIN VERIFICAR
    getNotverifiesAdresses: function(req, res){
       notVerifiedAddresses().then((value) => {
            return res.status(200).send({ 
                addresses: value.addresses,
                ids: value.ids
             });
       });
    },

    // BUSCAR UNA POR ID DE DOMICILIO
    searchAddress: function(req, res){
        var search = req.params.search;
     
            Address.find({_id: search}).populate('user').exec((err, addresses) => {
                if(err) return displayMessage(res, 500, 'Se produjo un error en el servidor');
                if(!addresses) return displayMessage(res, 404, 'Algo salió mal. Vuelva a intentarlo más tarde');
    
                return res.status(200).send({ addresses });
                
            });
       
       
    },

    // ACTUALIZAR UN DOMICILIO COMO 'VERIFICADO'
    updateAddress: function(req, res){
        var id = req.params.addressId;
        Address.findById(id, (err, address) => {
            if(!address) return displayMessage(res, 400, 'NJo se pudieron obtener los datos');
            if(address.verified == false){
                Address.findByIdAndUpdate(id, { verified: true }, {new: true}, (err, addressUpdated) => {
                    if(err) return displayMessage(res, 500, 'Error en el servidor');
                    if(!addressUpdated) return displayMessage(res, 400, 'No se ha podido verificar el domicilio');
                    return res.status(200).send({ address: addressUpdated });
                });
            } else if(address.verified == true){
                Address.findByIdAndUpdate(id, { verified: false }, {new: true}, (err, addressUpdated) => {
                    if(err) return displayMessage(res, 500, 'Error en el servidor');
                    if(!addressUpdated) return displayMessage(res, 400, 'No se ha podido verificar el domicilio');
                    return res.status(200).send({ address: addressUpdated });
                });
            }
        })
    }


}

/* FUNCIONALIDADES EXTRAS */

function displayMessage(res, code, messageText){
     res.status(code).send({ message: messageText });
}

function correctNickname(nickname){
    if(nickname.length < 7){
        return false;
    } else {
        return true;
    }
}

async function getDataUser(id){
    var user = await User.findOne({ _id: id }).exec().then((user) => {
        return user;
    }).catch((err) => {
        return handleError(err);
    });

    var address = await  Address.findOne({ user: id }).exec().then((address) => {
        return address;
    }).catch((err) => {
        return handleError(err);
    });

    return {
        user: user,
        address: address
    }
}

async function notVerifiedAddresses(){
    var addresses = await Address.find({ verified: false }).populate('user').exec().then((addresses) => {
        return addresses;
    }).catch(err => {
        return handleError(err);
    });

    var ids = await Address.find({ verified: false }).exec().then((addresses) => {
        var ids_clean = [];
        addresses.forEach((address) => {
            ids_clean.push(address._id);
        });
        return ids_clean;
    }).catch(err => {
        return handleError(err);
    });

    return {
        addresses: addresses,
        ids: ids
    };

}





module.exports = controller;
