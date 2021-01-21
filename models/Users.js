var mongoose = require("mongoose");

//Create User Schema
var UserSchema = new mongoose.Schema({
    firstName:String,
    lastName:String,
    userName:String,
    email: String,
    password:String
});

module.exports = mongoose.model("User",UserSchema);