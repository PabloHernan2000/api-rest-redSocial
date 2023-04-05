//Importar modelo
const Follow = require("../models/follow.model");
const User = require("../models/user.model");

//Importar servicios
const followService = require("../services/followService")

//Importar dependencias
const mongoosePaginate = require("mongoose-pagination");

//Acciones de prueba
const prueba = (req, res) => {
    return res.status(200).send({
        message: "Follow controller"
    });
}

// Guardar un follow (acción seguir)
const save = (req, res) => {
    //Obtener datos por body
    const params = req.body;

    //Sacar id de usuario identificado
    const identity = req.user;

    //Crear objeto
    let userToFollow = new Follow({
        user: identity.id,
        followed: params.followed
    });

    //Guardar objeto en db
    userToFollow.save((error, followStored) => {
        if (error || !followStored) {
            return res.status(500).send({
                status: "error",
                message: "Error al seguir usuario"
            });
        }

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            followStored: followStored
        });
    });



}

// Borrar un follow (dejar de seguir)
const unfollow = (req, res) => {
    //id de usuario identificado
    const userId = req.user.id;

    //id de ususario que sigo y quiero dejar de seguir
    const followedId = req.params.id;

    //Find de coincidencias y hacer remove
    Follow.find({
        "user": userId,
        "followed": followedId
    }).remove((error, userDeleted) => {

        if (error || !userDeleted) {
            return res.status(400).send({
                status: "error",
                message: "No has dejado de seguir a nadie!!"
            });
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Follow eliminado"
        });
    });
}

//Listado de usuarios seguidos que cualquier usuario esta siguiendo
const following = (req, res) => {

    //id de usuario identificado
    let userId = req.user.id;

    //Comnprobar si llega id por url
    if (req.params.id) { userId = req.params.id; }

    //Comprobar si llega la pagina
    let page = 1;
    if (req.params.page) { page = req.params.page; }
    page = parseInt(page); //Convertir a entero por que la url es tipo string

    //Usuarios por pagina
    const itemsPerPage = 5;

    //Find a follow, popular datos de usuario (por que la peticion solo obtendria los id y no la información) y paginar con mongoose paginate
    Follow.find({ user: userId })
        //      Datos a mostrar   ||    no mostrar
        .populate("user followed", "-password -role -__v -email")
        .paginate(page, itemsPerPage, async (error, follows, total) => {

            //Listado de usuarios
            //Array de ids de usuarios que me siguen y los que sigo
            let followUserIds = await followService.followUserIds(req.user.id);

            //Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Usuarios que estoy siguiendo",
                follows: follows,
                total,
                pages: Math.ceil(total / itemsPerPage),
                user_following: followUserIds.following,
                user_follow_me: followUserIds.followers
            });
        });
}

//Listado de usuarios que siguen a cualquier otro usuario (soy seguido)
const followers = (req, res) => {
    //id de usuario identificado
    let userId = req.user.id;

    //Comnprobar si llega id por url
    if (req.params.id) { userId = req.params.id; }

    //Comprobar si llega la pagina
    let page = 1;
    if (req.params.page) { page = req.params.page; }
    page = parseInt(page); //Convertir a entero por que la url es tipo string

    //Usuarios por pagina
    const itemsPerPage = 5;

    Follow.find({ followed: userId })
        //      Datos a mostrar   ||    no mostrar
        .populate("user", "-password -role -__v -email")
        .paginate(page, itemsPerPage, async (error, follows, total) => {

            //Listado de usuarios
            //Array de ids de usuarios que me siguen y los que sigo
            let followUserIds = await followService.followUserIds(req.user.id);

            //Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Usuarios que me siguen",
                follows: follows,
                total,
                pages: Math.ceil(total / itemsPerPage),
                user_following: followUserIds.following,
                user_follow_me: followUserIds.followers
            });
        });
}

module.exports = {
    prueba,
    save,
    unfollow,
    following,
    followers
}