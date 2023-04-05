const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    surname:{
        type: String
    },
    bio:{
        type: String
    },
    nick: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "role_user"
    },
    Image: {
        type: String,
        default: "default.png"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("User", UserSchema, "users");
                                //Nombre, esquema, en que colección se guardara