var mongoose = require("mongoose");

//Create User Schema
var QuestionSchema = new mongoose.Schema({
    quesName:{
        type :String,
        required:true
    },
    quesType:{
        type :String,
        required:true
    },
    quesLink:{
        type :String,
        required:true
    }
});

module.exports = mongoose.model("User",UserSchema);