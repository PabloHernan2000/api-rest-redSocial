const express = require("express");
const router = express.Router();
const publicationController = require("../controllers/publication.controller");
const check = require("../middlewares/auth");
const multer = require("multer") //Para subir archivos al servidor desde las peticiones

//Configuración de subida (multer)
const storage = multer.diskStorage({
    destination: function(req, file, cb){ //cb es para aplicar la configuración
        cb(null, "./uploads/publications/") //Recibe un parametro nulo y la ruta en donde se guardaran las imagenes
    },  
    filename: function(req, file, cb){
        cb(null, "pub-" + Date.now() + "-" + file.originalname);

    }
});

const uploads = multer({storage});

//Definir rutas
router.get("/prueba-publication", publicationController.prueba);
router.post("/publicar", check.auth ,publicationController.savePublication);
router.get("/detail/:id", check.auth ,publicationController.detail);
router.delete("/remove/:id", check.auth ,publicationController.deletePublication);
router.get("/publication-user/:id/:page?", check.auth ,publicationController.userPublications);
router.post("/upload/:id", [check.auth, uploads.single("file0")] ,publicationController.upload);
router.get("/media/:file", check.auth ,publicationController.media);
router.get("/feed/:page?", check.auth ,publicationController.feed);

//Exportar router
module.exports = router;