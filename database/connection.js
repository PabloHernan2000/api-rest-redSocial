const mongoose = require("mongoose");

const connection = async() => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect("mongodb://127.0.0.1:27017/mi_red_social");
        console.log("Connection to database 'mi_red_social' successful")
    } catch (error) {
        console.log(error);
        throw new Error("Failed to try connect to database!!")
    }
}

module.exports = connection;