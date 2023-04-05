const mongoose = require('mongoose');

const publicationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId, //Se guarda el ID
        ref: 'User' //Se hace referencia al modelo de usuario
    },
    text: {
        type: String,
        required: true
    },
    file: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});
                                //Nombre del modelo, esquema, nombre de la coleción en la bd
module.exports = mongoose.model("Publication", publicationSchema, "publications");