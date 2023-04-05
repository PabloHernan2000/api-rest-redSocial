const Publication = require('../models/publication.model')

//Importar dependencias
const mongoosePaginate = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");

//Importar servicios
const followService = require("../services/followService");

//Acciones de prueba
const prueba = (req, res) => {
    return res.status(200).send({
        message: "Publication controller"
    });
};

//Guardar publicación
const savePublication = (req, res) => {

    //Obtener id de ususario identificado
    let identityId = req.user.id;

    //Obtener parametros body
    let params = req.body;

    //Validar la publicación
    if (!params.text) {
        return res.status(500).send({
            status: "error",
            message: "Debes escribir algo"
        });
    }

    //Guardar publicación
    let newPublication = new Publication(params);
    newPublication.user = identityId;

    newPublication.save((error, publicationStored) => {
        if (error || !publicationStored) {
            return res.status(500).send({
                status: "error",
                message: "La publicación no se guardó correctamente"
            });
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada correctamente",
            publicationStored
        });
    });
};

//Obtener una publicación
const detail = (req, res) => {

    //Obtener id de publicación por url
    const idPublication = req.params.id;

    //FindById
    Publication.findOne({ "_id": idPublication }).exec((error, publication) => {
        if (error || !publication) {
            return res.status(500).send({
                status: "error"
            });
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publication
        });
    });

};

//Eliminar publicaciones
const deletePublication = (req, res) => {
    //Obtener id de publicación por url
    const idPublication = req.params.id;

    //Find and Remove
    Publication.findOneAndDelete({ "user": req.user.id, "_id": idPublication }).exec((error, publicationDeleted) => {
        if (error || !publicationDeleted) {
            return res.status(500).send({
                status: "error"
            });
        }
        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación eliminada correctamente"
        });
    });
};

//Listar todas las publicaciones
const userPublications = (req, res) => {

    //Id de usuario URL
    const userId = req.params.id;

    //Comprobar si llega la pagina
    let page = 1;
    if (req.params.page) { page = req.params.page; }
    page = parseInt(page); //Convertir a entero por que la url es tipo string

    const itemsPerPage = 5;

    //Find, populate, ordenar, paginar
    Publication.find({ "user": userId })
        .sort("-created_at") //Ordenar en orden descendente
        .populate("user", "-password -__v -role -email")
        .paginate(page, itemsPerPage, (error, publications, total) => {
            if (error || !publications || publications.length <= 0) {
                return res.status(404).send({
                    status: "error"
                });
            }
            //Devoler respuesta
            return res.status(200).send({
                status: "success",
                publications,
                page,
                pages: Math.ceil(total / itemsPerPage),
                total
            });
        });

}

//Subir ficheros
const upload = (req, res) => {
    //Obtener id de publicación
    const publicationId = req.params.id;

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
    Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }, (error, publicationUpdated) => {
        if (error || !publicationUpdated) {
            //Devolver respuesta
            return res.status(200).send({
                status: "error",
                message: "Error al subir imagen"
            });
        }

        //Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file,
        });
    });
}

//Devolver archivos multimedia imagenes
const media = (req, res) => {
    //Obtener nombre de archivo (url)
    const file = req.params.file;

    //Crear el path real de la imagen
    const filePath = "./uploads/publications/" + file;

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
    })

}

//Listar todas las publicaciones (feed)
const feed = async (req, res) => {

    //sacar la pagina actual
    let page = 1;
    if (req.params.page) { page = req.params.page }

    //establecer numero de elementos por pagin
    let itemsPerPage = 5;

    //sacar un array de identificicadores de usuarios que yo sigo como usuario logueado
    try {
        const myFollows = await followService.followUserIds(req.user.id);


        //Find a publicaciones con operador in, ordenar, popular y paginar
        Publication.find({
            user: { "$in": myFollows.following }
        }).populate("user", "-password -role -__v -bio -email")
            .sort("-created_at")
            .paginate(page, itemsPerPage, (error, publication, total) => {

                if (error || !publication) {
                    return res.status(500).send({
                        status: "error",
                        message: "No hay publicaciones para mostrar"
                    });
                }

                //Devolver respuesta
                return res.status(200).send({
                    status: "success",
                    myFollows: myFollows.following,
                    publication,
                    total,
                    itemsPerPage,
                    page,
                    totalPage: Math.ceil(total / itemsPerPage)
                });
            });

    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "No se han listado las publicaiones del feed"
        });
    }

}



module.exports = {
    prueba,
    savePublication,
    detail,
    deletePublication,
    userPublications,
    upload,
    media,
    feed
}