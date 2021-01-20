const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// Sends the list of Questions
app.get("/questions", function(req, res){
  res.render("questions.ejs");
})

//Send Sign up page -incomplete
app.get("/", function(req, res){
  res.send("hello");
})

app.listen(3000, function(){
  console.log("server listening on 3000");
})
