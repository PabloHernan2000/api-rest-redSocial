const mongoose = require("mongoose");

const followSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId, //Se va a guardar una referencia a otro objeto
        ref: "User"
    },
    followed: {
        type:  mongoose.Schema.ObjectId, //Se va a guardar una referencia a otro objeto
        ref: "User"
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("follow", followSchema, "follows");