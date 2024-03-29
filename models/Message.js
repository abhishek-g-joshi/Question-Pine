var mongoose = require("mongoose");

var messageSchema = new mongoose.Schema({

    userName :{
        type : String,
        required : true
    },
    datetime :{
        type: Date,
        required: true
    },
    content :{
        type: String,
        required: false
    }
});

module.exports = mongoose.model("Message", messageSchema);
