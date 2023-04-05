//Importar dependencias y modulos
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");//Paginación
const fs = require("fs"); //File system
const path = require("path");
const validate = require("../helpers/validate");

//Importar services
const jwt = require("../services/jwt");
const followService = require("../services/followService")
const Follow = require("../models/follow.model");
const Publication = require("../models/publication.model");


//Acciones de prueba
const prueba = (req, res) => {
    res.status(200).send({
        message: "User controller",
        user: req.user
    });
}

const registro = (req, res) => {
    //Obtener parametros del body
    let params = req.body;

    //Comprobar si llegan bien y validar
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos"
        });
    }

    //Validación avanzada
    try {
        validate.validate(params);   
    } catch (error) {
        return res.status(400).send({
            status: "error",
            message: "Validación no superada!!"
        });
    }

    //Control de usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { email: params.nick.toLowerCase() }
        ]
    }).exec(async (error, users) => { //async por que va a devolver una promesa en este caso la contraseña cifrada
        if (error) {
            return res.status(500).send({
                status: "error",
                message: "Error en la consulta de usuarios"
            });
        }
        if (users && users.length >= 1) {
            return res.status(200).send({
                status: "error",
                message: "El usuario ya existe"
            });
        }
        //Cifrar contraseña
        let pwd = await bcrypt.hash(params.password, 10); //await es para esperar a que la promesa se resuelva
        params.password = pwd;

        //Crear objeto usuario
        let user_to_save = new User(params);

        //Guardar usuario en DB
        user_to_save.save((error, userStored) => {
            if (error || !userStored) {
                return res.status(400).send({
                    status: "error",
                    message: "Error al registrar el usuario"
                });
            }
            //Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Usuario registrado correctamente",
                user: userStored
            });
        });
    });
}
const login = (req, res) => {
    //Obtener parametros del body
    let params = req.body;

    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Email o contraseña faltantes"
        });
    }

    //Buscar si existe
    User.findOne({ email: params.email })
        /* .select({ "password": 0 }) */
        .exec((error, userFound) => {
            if (error || !userFound) {
                return res.status(400).send({
                    status: "error",
                    message: "No existe el usuario"
                });
            }
            //Comprobar contraseña
            const pwd = bcrypt.compareSync(params.password, userFound.password);
            if (!pwd) {
                return res.status(400).send({
                    status: "error",
                    message: "Contraseña incorrecta"
                });
            }

            //Obtener Token
            const token = jwt.createToken(userFound);

            //Retornar Datos usuario
            return res.status(200).send({
                status: "success",
                user: {
                    id: userFound._id,
                    name: userFound.name,
                    nick: userFound.nick
                },
                token
            });
        });
}

const profile = (req, res) => {
    //Recibir parametro de id de usuario por url
    let id = req.params.id;

    //Consulta para sacar datos del usuario
    User.findById({ _id: id })
        .select({ password: 0, role: 0 }) //Para no mostrar algunos datos
        .exec(async (error, userProfile) => {
            if (error || !userProfile) {
                res.status(400).send({
                    status: "error",
                    message: "Usuario no encontrado"
                });
            }

            //Info de seguimiento
            const followInfo = await followService.followThisUser(req.user.id, id);

            //Devolver respuesta e información de follows
            res.status(200).send({
                status: "success",
                userProfile: userProfile,
                following: followInfo.following,
                follower: followInfo.follower
            });
        })
}

const listUsers = (req, res) => {
    //Controlar en que pagina estamos
    let page = 1; //valor por defecto
    if (req.params.page) {
        page = req.params.page; //Asignar valor
    }
    page = parseInt(page); //Convertir a entero por que la url es tipo string

    //Consulta con mongoose paginate
    let itemsPerPage = 5; //Usiarios por pagina

    User.find().select("-password -email -role -__v").sort('_id').paginate(page, itemsPerPage, async (error, users, total) => {
        if (error || !users) {
            return res.status(404).send({
                status: "error",
                message: "No hay usuarios disponibles",
                error
            });
        }

        //Array de ids de usuarios que me siguen y los que sigo
        let followUserIds = await followService.followUserIds(req.user.id);

        //Devolver resultado (posteriormente info de follows)
        return res.status(200).send({
            status: "success",
            users,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            following: followUserIds.following,
            follower: followUserIds.followers
        });
    });
}

const update = (req, res) => {
    //Recoger info de usuario a actualizar
    let userIdentity = req.user;
    let userToUpdate = req.body;

    //Quitar campos sobrantes
    delete userIdentity.iat;
    delete userIdentity.exp;
    delete userIdentity.role;
    delete userIdentity.image;

    //Comprobar si el usuario ya existe
    User.find({
        $or: [
            { email: userToUpdate.email.toLowerCase() },
            { email: userToUpdate.nick.toLowerCase() }
        ]
    }).exec(async (error, users) => { //async por que va a devolver una promesa en este caso la contraseña cifrada
        if (error) {
            return res.status(500).send({
                status: "error",
                message: "Error en la consulta de usuarios"
            });
        }

        let userIsset = false;
        users.forEach(user => {
            if (user && user._id != userIdentity.id) {
                userIsset = true;
            }
        });
        if (userIsset) {
            return res.status(200).send({
                status: "error",
                message: "El usuario ya existe"
            });
        }
        //Cifrar contraseña
        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10); //await es para esperar a que la promesa se resuelva
            userToUpdate.password = pwd;
        }else{ //Si no llega la contrase;a borrar el campo
            delete userToUpdate.password;
        }

        //Buscar y actualizar
        User.findByIdAndUpdate(userIdentity.id, userToUpdate, { new: true }, (error, userUpdated) => {

            if (error || !userUpdated) {
                return res.status(500).send({
                    status: "error",
                    message: "Usuario no actualizado"
                });
            }

            //Devolver respuesta
            return res.status(200).send({
                status: "success",
                user: userUpdated
            });
        })

    });
}

const upload = (req, res) => {

    //Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "La petición no incluye la imagen"
        });
    }

    //Obtener nombre de archivo
    let image = req.file.originalname;

    //Obtener extensión
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    //Comprobar extensión
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        //Borrar archivo subido
        const filePath = req.file.path; //Obtener rita del archivo
        const fileDeletes = fs.unlinkSync(filePath); //Borrar el archivo

        //Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión de fichero invalida"
        });
    }

    //Si es correcta guardar en db
    User.findOneAndUpdate({ _id: req.user.id }, { Image: req.file.filename }, { new: true }, (error, userUpdated) => {
        if (error || !userUpdated) {
            //Devolver respuesta
            return res.status(200).send({
                status: "error",
                message: "Error al subir imagen"
            });
        }

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            user: userUpdated,
            file: req.file,
        });
    });
}

const avatar = (req, res) => {
    //Obtener nombre de archivo (url)
    let file = req.params.file;

    //Crear el path real de la imagen
    const filePath = "./uploads/avatars/" + file;

    //Comprobar que existe
    fs.stat(filePath, (error, exists) => {
        if (error || !exists) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }

        //Devolver un file
        return res.sendFile(path.resolve(filePath));
    });
}

const counters = async (req, res) => {

    let userId = req.user.id;

    if (req.params.id) { userId = req.params.id }

    try {
        const following = await Follow.count({ "user": userId });
        const followed = await Follow.count({ "followed": userId });
        const publications = await Publication.count({ "user": userId });

        return res.status(200).send({
            status: "success",
            following: following,
            followed: followed,
            publications: publications
        });

    } catch (error) {

    }
}
module.exports = {
    prueba,
    registro,
    login,
    profile,
    listUsers,
    update,
    upload,
    avatar,
    counters
}