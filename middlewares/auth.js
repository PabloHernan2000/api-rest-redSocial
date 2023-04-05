//Importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//Importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

//Middleware de autenticación
exports.auth = (req, res, next) => { //next es para hacer un salto al siguiente metodo o acción

    //Comprobar si llega la cabecera de autenticación
    if (!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "La petición no tiene la cabecera de autenticación"
        });
    }
    //Decodificar token
    let token = req.headers.authorization.replace(/['"]+/g, ''); //Limpiar token
    try {
        let payload = jwt.decode(token, secret);

        //Comprobar expiración de token
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({
                status: "error",
                message: "Token expirado"
            });
        }
        
        //Añadir datos de usuario a request
        req.user = payload;
    } catch (error) {
        return res.status(404).send({
            status: "error",
            message: "Token invalido",
            error
        });
    }

    //Pasar a ejecución de acción
    next() //Para ejecutar la acción del controlador
}