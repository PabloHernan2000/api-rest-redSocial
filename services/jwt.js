//Importar dependencias
const jwt = require("jwt-simple");
const moment = require("moment");

//Definir clave para generar token
const secret = "CLAVE_SECRETA_del_curso_del_proyecto_De_lA_ReD_sOcIAL_$$";

//Crear función para generar tokens
const createToken = (user) =>{
    const payload = { //Lo que se carga dentro del token
        id:user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(), //Hace referencia al momento en que se crea este payload
        exp: moment().add(30, "days").unix() //Fecha de expiración del token
    }

    //Devoler jwt token codificado
    return jwt.encode(payload, secret);
}

module.exports = {
    createToken,
    secret
}

