var mongoose = require("mongoose");
//const messageSchematmp = require("./Message");

var messageSchematmp = new mongoose.Schema({

    userName :{
        type : String,
        required : true
    },
    Datetime :{
        type: Date,
         required: true
    },
    content :{
        type: String,
        required: false
    }
});

//const Messagetmp = mongoose.model("Messagetmp", messageSchematmp);

var DiscussionSchema = new mongoose.Schema({

    discussionID:{
        type : String,
        required : true
    },
    discussionName:{
        type: String,
         required: true
    },

    currentMembers:[String],

    requestedMembers:[String],

    msgArray: [messageSchematmp]
});

module.exports = mongoose.model("Discussion", DiscussionSchema);
