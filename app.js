const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const session = require('express-session')
const User = require("./models/Users");
const Profile = require("./models/Profiles");
const Question = require("./models/Questions");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const dotenv = require('dotenv').config();

const users = require("./routes/api/users");

const app = express();  

const questionTypes = ["Array","String","Matrix","Linked List","Stack","Queue","Tree","Graph","Greedy","Backtracking","Recursion","Dynamic Programing","Bit Manipulation","Hash Table","Sort","Searching","Map","Segment Tree"];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.static("views"));
app.use(cookieParser());

//flash msgs

// app.use(flash());
// app.use(session({cookie: {maxAge: null}}))
// app.use(cookieParser('abc'));
// app.use(session({
//   secret: 'abc',
//   saveUninitialized: true,
//   resave: true}));
// app.use(flash());
// app.use(passport.initialize());
// app.use(passport.session());

// app.use((req, res, next)=>{
//   res.locals.message = req.session.message
//   delete req.session.message
//   next()
// })

// app.use(function(req, res, next) {
//   res.locals.messages = req.flash();
//   next();
// });

const validateSignUpInputs = require("./validation/signup");
const validateSignInputs = require("./validation/signin");
const Users = require("./models/Users");

// mongoose.connect("mongodb://localhost:27017/teamRudras", { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, useNewUrlParser: true, useUnifiedTopology: true});

mongoose.connect("mongodb+srv://@cluster0.xhct6.mongodb.net/", 
{ 
  dbName : process.env.DB_NAME,
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASSWORD,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}
);




const secreteKey = process.env.SECRETE_KEY;

const createToken = (id) =>{
  return jwt.sign({id},secreteKey,
  {expiresIn: 3600});
}


// *****************************************************ALL THE POST REQUEST BELOW ************************************************

//POST : User signup route
app.post("/signup",(req,res)=>{

  const {errors, isValid} = validateSignUpInputs(req.body);
  //check validation
  if(!isValid)
  {
    return res.status(400).json(errors);
  }

  User.findOne({$or : [{ email: req.body.email }, { userName: req.body.userName }]}).then(user =>{
    if(user){
      console.log(user);
      errors.email = "User already exits";
      return res.status(400).json(errors);
    }else{
      const arr = [];
      const userObject = new User({
       firstName : req.body.firstName,
       lastName : req.body.lastName,
       userName : req.body.userName,
       email : req.body.email,
       password : req.body.password,
       solvedQuestions: arr,
       college: "--",
       dob: "--",
       country: "--",
       city: "--",
       contactno:"",
       bio:"Welcome to Q'Pine",
       //solvedCount: val
       
      });

      const profileInfo = new Profile({})
      bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(userObject.password, salt, (err, hash)=>{
          if(err) throw err;
          userObject.password = hash;
          userObject
            .save()
            .then(
              res.redirect("/signin"))
            .catch(err =>console.log(err));
        });
      });

    }
  });
});

//POST : User signin route 
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
      const token = createToken(user._id);
      res.cookie('jwt', token, { maxAge: 3600 * 1000 });
      console.log({ user : user._id });
      res.redirect("/homepage");
    }else{
      errors.password= 'password incorrect';
      return res.status(400).json(errors);
    }
  });
  });
})

function phonenumber(contactno)
{
  var phoneno = /^\d{10}$/;
  if((contactno.match(phoneno)))
    {
      return true;
    }
      else
        {
        // alert("message");
        return false;
        }
}


//POST : Edit profile info route
app.post("/:userName/editprofile/:user_id",checkUser,(req,res)=>{

  const userName = req.params.userName;
  const user_id = req.params.user_id

  const special_id = user_id;
  const contactno = req.body.contactno.toString();
 
  User.findOneAndUpdate(
    {_id : user_id},
    {
      $set: {
         special_id : user_id,
         userName : userName,
         firstName : req.body.firstName,
         lastName : req.body.lastName,
         contactno : req.body.contactno,
         college : req.body.college,
         dob : req.body.dob,
         country : req.body.country,
         city: req.body.city,
         bio : req.body.bio
      }
    },
    { new: true},
    (err, profile)=>{
      if(err)
      {
        console.log(err)
      }else{
        console.log(profile)
        res.redirect("/"+ profile.userName)
      }
      //Create new user and add to database

  });
});

//POST : Add question route
app.post("/addQuestion", (req, res)=> {
  const newQuestion = new Question({
    quesName: req.body.quesName,
    quesLink: req.body.quesLink,
    quesType: req.body.quesType,
  })

  newQuestion.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/addQuestion");
    }
  })

});

function arrayRemove(arr, value) {
    return arr.filter(function(ele){
        return ele != value;
    });
}

//POST : display question route
app.post("/questions/:userName", (req, res)=> {
  const questionName = req.body.questionName;
  const solvedStatus = req.body.solvedStatus;

  console.log(questionName);
  console.log(solvedStatus);


  // const id = localStorage.getItem('id');
  const id = req.params.id;
  const userName = req.params.userName;

  User.findOne({userName}, function(err, foundOne){
    if(err){
      console.log(err);
    }else {
      if(solvedStatus === "done"){
        foundOne.solvedQuestions = arrayRemove(foundOne.solvedQuestions, questionName);
        //foundOne.solvedCount--;
      }else{
        foundOne.solvedQuestions.push(questionName);
        //foundOne.solvedCount++;
      }
      foundOne.save();
      res.redirect("/questions/"+ userName);
    }
  })
})




// ***************************************ALL THE GET REQUEST ARE BELOW ****************************************************

//check current user
app.get("*",checkUser);

//singin route
app.get("/signin",(req,res)=>{
  res.render("signIn.ejs");
})

//Signout routes
app.get("/signout",(req,res)=>{
  res.cookie('jwt','', {maxAge:1});
  res.redirect("/homepage");
})

app.use("/api/users",users);



//Homepage route
app.get("/homepage", function(req, res){
  res.render("homepage.ejs");
})

//landing route
app.get("/landing", function(req, res){
  res.render("homepage.ejs");
})

//landing route
app.get("/", function(req, res){
  res.render("homepage.ejs");
})
//signup route
app.get("/signup",function(req,res){
  res.render("signUp.ejs");
})


function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Sends the list of Questions and also searches a question
app.get("/questions/:userName", requireAuth, (req, res)=>{

  if(req.query.search)
  {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Question.find({quesName: regex}, function(err, questions){
      if(err){
        console.log(err);
      }else{
        // const userID = localStorage.getItem('id');
        const userID = req.params.id;
        const questionList = questions;
        const userName = req.params.userName;    
        console.log(userID);
  
        User.findOne({userName}, function(err, foundOne){
          if(err){
            console.log(err);
          }else{
            console.log(foundOne);
            const solvedQuestions = foundOne.solvedQuestions;
  
  
            res.render("questions.ejs", {questionList: questionList, solvedQuestions: solvedQuestions, questionTypes: questionTypes});
        
          }
        })
  
      }
    })
  }
  else
  {
    Question.find({}, function(err, questions){
      if(err){
        console.log(err);
      }else{
        // const userID = localStorage.getItem('id');
        const userID = req.params.id;
        const questionList = questions;
        const userName = req.params.userName;   
        console.log(userID);

        User.findOne({userName}, function(err, foundOne){
          if(err){
            console.log(err);
          }else{
            console.log(foundOne);
            const solvedQuestions = foundOne.solvedQuestions;

            res.render("questions.ejs", {questionList: questionList, solvedQuestions: solvedQuestions, questionTypes: questionTypes});
           
          }
        })

      }
    })
  }
});



app.get("/chatroom", requireAuth, (req, res)=>{
  res.render("chatroom.ejs");
});

app.get("/leaderboard", requireAuth, (req, res)=>{

  User.find({}, (err, users)=> {
    if(err){
      console.log(err);
    }else {
      // console.log(users);

      users.sort((a,b) => (a.solvedQuestions.length < b.solvedQuestions.length) ? 1 : ((b.solvedQuestions.length < a.solvedQuestions.length) ? -1 : 0))

      console.log(users);
      res.render("leaderboard", {users: users});
    }
  })

});

app.get("/aboutus", (req, res)=>{
  res.render("aboutus.ejs");
});

app.get("/addQuestion", (req, res)=> {
  res.render("addQuestion.ejs");
})

//profile route
app.get("/:id/", requireAuth, function(req, res){
  const userName = req.params.id;
  User.findOne({userName},(err,foundOne)=>{
    if(foundOne)
    {
      res.render("profile.ejs",{userData: foundOne});
    }else{
      res.status(404).json(err)
      // console.log()
    }
  })
    
})

app.get("/:userName/editprofile", requireAuth, function(req, res){
  res.render("editprofile.ejs");
})



// *************************************************listening ****************************************************************
const PORT = process.env.PORT || 3000;

app.listen(PORT, function(){
  console.log("server listening on " + PORT);
})
