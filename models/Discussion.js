var mongoose = require("mongoose");
//const messageSchematmp = require("./Message");

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
        required: true
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

    admin:{
        type : String,
        required : true
    },

    description: String,

    currentMembers:[String],

    requestedMembers:[String],

    msgArray: [messageSchema]
});

module.exports = mongoose.model("Discussion", DiscussionSchema);
