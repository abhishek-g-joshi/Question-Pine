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
    contactno:{
        type: Number,
        required : false
    },
    college:{
        type: String,
        required: false
    },
    dob:{
        type: String,
        required: false
    },
    country:{
        type: String,
        required: false
    },
    city:{
        type: String,
        required: false
    },
    bio:{
        type:String,
        required:false
    },
    solvedQuestions: [String],

    activeDiscussions: [String],

    reqDiscussions: [String],

    reset_password_token: {
        type: String
    },
    reset_password_expires: {
        type: Date
    },


});

module.exports = mongoose.model("User",UserSchema);
