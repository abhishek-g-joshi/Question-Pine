var mongoose = require("mongoose");

//Create User Schema
var UserSchema = new mongoose.Schema({
    firstName:{
        type :String,
        required:true
    },
    lastName:{
        type :String,
        required:true
    },
    userName:{
        type :String,
        required:true
    },
    email: {
        type :String,
        required:true
    },
    password: {
        type :String,
        required:true
    },
    //doubtful: how to make a array inside the schema
    solvedQuestions: [String]
});

module.exports = mongoose.model("User",UserSchema);
