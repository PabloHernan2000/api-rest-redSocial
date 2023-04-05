const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const check = require("../middlewares/auth");
const multer = require("multer") //Para subir archivos al servidor desde las peticiones

//Configuración de subida (multer)
const storage = multer.diskStorage({
    destination: function (req, file, cb) { //cb es para aplicar la configuración
        cb(null, "./uploads/avatars/") //Recibe un parametro nulo y la ruta en donde se guardaran las imagenes
    },
    filename: function (req, file, cb) {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname);

    }
});

const uploads = multer({ storage });


//Definir rutas
router.get("/prueba-user", check.auth, userController.prueba);
router.post("/register", userController.registro);
router.post("/login", userController.login);
router.get("/profile/:id", check.auth, userController.profile);
router.get("/list/:page?", check.auth, userController.listUsers);
router.put("/update", check.auth, userController.update);
router.post("/upload", [check.auth, uploads.single("file0")], userController.upload); /* uploads.single("file0") se subira un solo archivo desde el campo file0 */
router.get("/avatar/:file", check.auth, userController.avatar);
router.get("/counters/:id", check.auth, userController.counters);

//Exportar router
module.exports = router;


//Middleware se ejecuta antes del metodo de la ruta sirve para hacer una comprobación antes de la acción (metodo de ruta)