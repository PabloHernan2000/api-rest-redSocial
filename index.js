//Importar dependencias
const connection = require("./database/connection")
const express = require("express");
const cors = require("cors");

//Importar controladores
const User = require("./controllers/user.controller");

//Mensaje bienvenida de API
console.log("API para Red Social iniciada!")

//Conexión a base de datos
connection();

//Crear servidor de node
const app = express();
const port = 3900;

//Configurar cors
app.use(cors());

//Convertir datos de body a objetos js
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Cargar rutas
const userRoutes = require("./routes/user.routes");
const publicationRoutes = require("./routes/publication.routes");
const followRoutes = require("./routes/follow.routes");

app.use("/api", userRoutes);
app.use("/api", publicationRoutes);
app.use("/api", followRoutes);

//Servidor a escuchar peticiones
app.listen(port, () => {
    console.log("Servidor de Node ejecutandose en el puerto" + port);
})