const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("./models/Users");
const mongoose = require("mongoose");

const validateSignUpInputs = require("./validation/signup");
const validateSignInputs = require("./validation/signin");

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
app.post("/signup",(req,res)=>{

  const {errors, isValid} = validateSignUpInputs(req.body);
  //check validation
  if(!isValid)
  {
    return res.status(400).json(errors);
  }
  
  User.findOne({email:req.body.email}).then(user =>{
    if(user){
      errors.email = "Email already exits";
      return res.status(400).json(errors);
    }else{
      //object containing users info
      const userObject = new User({
       firstName : req.body.firstName,
       lastName : req.body.lastName,
       userName : req.body.userName,
       email : req.body.email,
       password : req.body.password,
      });
      //Create new user and add to database
      // User.create(usersObject,function(err,newUser){
      //   if(err){
      //     console.log(err);
      //   }else{
      //     res.redirect("/questions");
      //   }
      // })
      bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(userObject.password, salt, (err, hash)=>{
          if(err) throw err;
          userObject.password = hash;
          userObject
            .save()
            .then(res.redirect("/homepage"))
            .catch(err =>console.log(err));
        });
      });
    }
  });
});

//singin route
app.get("/signin",(req,res)=>{
  res.render("signIn.ejs");
})

//
app.post("/signin",(req,res)=>{
  const {errors, isValid} = validateSignInputs(req.body);

  if(!isValid)
  {
    return res.status(400).json(errors);
  }

  const email = req.body.email;
  const password = req.body.password;

  //find user by email
  User.findOne({email})
    .then(user =>{
    if(!user)
    {
      errors.email = "User not found";
      return res.status(400).json(errors);
    }

    //check password
   bcrypt.compare(password,user.password)
    .then(isMatch => {
      if(isMatch){
      //User matched, create payload
      const payload = {id:user.id, firstName:user.firstName, lastName:user.lastName, userName:user.userName, email:user.email}

      //Sign token
      jwt.sign(payload,
        'shhhaaSecretKey',
        {expiresIn: 3600},
        (err,token)=>{
          res.json({
            success:true,
            token: 'bearer ' + token
          })
        }
      )
      return res.redirect('/questions');
    }else{
      errors.password= 'password incorrect';
      return res.status(400).json(errors);
    }
  });
  });
})

app.listen(3000, function(){
  console.log("server listening on 3000");
})
