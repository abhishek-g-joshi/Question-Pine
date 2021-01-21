const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var User = require("./models/Users");
var mongoose = require("mongoose");

mongoose.connect("mongodb+srv://rudrasUsers:TeaMRuDrAs123@cluster0.xhct6.mongodb.net/<rudrasUsers>?retryWrites=true&w=majority", { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, useNewUrlParser: true, useUnifiedTopology: true});

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// Sends the list of Questions
app.get("/questions", function(req, res){
  res.render("questions.ejs");
})

//Homepage route
app.get("/homepage", function(req, res){
  res.render("homepage.ejs");
})

//signup route
app.get("/signup",function(req,res){
  res.render("signUp.ejs");
})

//Create new User
app.post("/users",function(req,res){
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var userName = req.body.userName
  var email = req.body.email;
  var password = req.body.password;
  //object containing users info
  var usersObject = {firstName:firstName, lastName:lastName, userName:userName, email:email, password:password};
  //Create new user and add to database
  User.create(usersObject,function(err,newUser){
    if(err){
      console.log(err);
    }else{
      res.redirect("/questions");
    }
  })

})

//singin route
app.get("/signin",function(req,res)
{
  res.render("signIn.ejs");
})
app.listen(3000, function(){
  console.log("server listening on 3000");
})
