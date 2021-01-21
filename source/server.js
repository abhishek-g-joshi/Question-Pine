const mongoose = require('mongoose');


// const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://rudrasUsers:<TeaMRuDrAs123>@cluster0.xhct6.mongodb.net/<rudrasUsers>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
});

// const uri = “YOUR CONNECTION STRING“;
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB Connected…")
})
.catch(err => console.log(err))