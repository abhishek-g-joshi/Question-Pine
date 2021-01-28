const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("./models/Users");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require("./middleware/authMiddleware");

const users = require("./routes/api/users");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieParser());

const validateSignUpInputs = require("./validation/signup");
const validateSignInputs = require("./validation/signin");

mongoose.connect("mongodb+srv://rudrasUsers:TeaMRuDrAs123@cluster0.xhct6.mongodb.net/<rudrasUsers>?retryWrites=true&w=majority", { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, useNewUrlParser: true, useUnifiedTopology: true});



const createToken = (id) =>{
  return jwt.sign({id},'shhhaaSecretKey',
  {expiresIn: 3600});
}


app.use("/api/users",users);

//check current user
app.get("*",checkUser);

//Homepage route
app.get("/homepage", function(req, res){
  res.render("homepage.ejs");
})

//landing route
app.get("/landing", function(req, res){
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
      const token = createToken(userObject._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: 3600 * 1000 });
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
      // const payload = {id:user._id, firstName:user.firstName, lastName:user.lastName, userName:user.userName, email:user.email}

      //Sign token
      // const token = jwt.sign(payload,
      //   'shhhaaSecretKey',
      //   {expiresIn: 3600},
      //   (err,token)=>{
      //     // console.log(json({
      //     //   success:true,
      //     //   token
      //     // }))
      //     // res.redirect("/questions");
      //     res.status(200).json({
      //         success:true,
      //         token
      //     })
      //     // console.log(json({token}));
      //   }
      // )
      // res.cookie('jwt',token,{httpOnly:true,maxAge:3600*1000})
      // return res.redirect('/questions');
      const token = createToken(user._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: 3600 * 1000 });
      console.log({ user: user._id });
      res.redirect("/homepage");
    }else{
      errors.password= 'password incorrect';
      return res.status(400).json(errors);
    }
  });
  });
})

//Signout routes
app.get("/signout",(req,res)=>{
  res.cookie('jwt','', {maxAge:1});
  res.redirect("/homepage");
})


// Sends the list of Questions
app.get("/questions", requireAuth, (req, res)=>{
  res.render("questions.ejs");
});

app.get("/chatroom", requireAuth, (req, res)=>{
  res.render("chatroom.ejs");
});

app.get("/leaderboard", requireAuth, (req, res)=>{
  res.render("leaderboard.ejs");
});

//profile route
app.get("/profile", requireAuth, function(req, res){
  res.render("profile.ejs");
})

app.get("/profile/profileinfo", requireAuth, function(req, res){
  res.render("profileinfo.ejs");
})

app.get("/aboutus", (req, res)=>{
  res.render("aboutus.ejs");
});

app.listen(3000, function(){
  console.log("server listening on 3000");
})
