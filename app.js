const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("./models/Users");
const Profile = require("./models/Profiles");
const Question = require("./models/Questions");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require("./middleware/authMiddleware");

var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

const users = require("./routes/api/users");

const app = express();

const questionTypes = ["array", "matrix", "string", "searching-and-sorting"];

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieParser());

const validateSignUpInputs = require("./validation/signup");
const validateSignInputs = require("./validation/signin");

mongoose.connect("mongodb://localhost:27017/teamRudras", { user: process.env.MONGO_USER, pass: process.env.MONGO_PASSWORD, useNewUrlParser: true, useUnifiedTopology: true});

//added a question to the database manually
// const ques = new Question({
//   quesName: "find max",
//   quesLink: "https://practice.geeksforgeeks.org/problems/help-a-thief5938/1",
//   quesType: "Array"
// });
//
// ques.save();



const createToken = (id) =>{
  return jwt.sign({id},'shhhaaSecretKey',
  {expiresIn: 3600});
}


// *****************************************************ALL THE POST REQUEST BELOW ************************************************

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
      //const val=0;

      const arr = ["test", "test2"];
      const userObject = new User({
       firstName : req.body.firstName,
       lastName : req.body.lastName,
       userName : req.body.userName,
       email : req.body.email,
       password : req.body.password,
       solvedQuestions: arr
       //solvedCount: val
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
            .then(res.redirect("/signin"))
            .catch(err =>console.log(err));
        });
      });
      const token = createToken(userObject._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: 3600 * 1000 });
    }
  });
});


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
      console.log({ user : user._id });
      // const u =  user._id;
      localStorage.setItem('id', user._id);
      localStorage.setItem('userName', user.userName)
      // console.log(localStorage.getItem('userName'))
      res.redirect("/homepage");
    }else{
      errors.password= 'password incorrect';
      return res.status(400).json(errors);
    }
  });
  });
})



app.post("/profile/profileinfo",checkUser,(req,res)=>{

  // const token = req.cookies.jwt;
  // console.log(token);

  const user_id = localStorage.getItem('id');
  const userName = localStorage.getItem('userName');
  // console.log(localStorage.getItem('userName'));
  // console.log({user_id: user_id});
  // console.log({userName: userName});

  const special_id = user_id;

  // User.findOne({})
  Profile.findOne({special_id}).then(profile =>{
    if(profile){
      res.status(400).json(profile);
      console.log("profile route running");
    }else{
      //object containing users info
        const profileObject = new Profile({
         special_id : user_id,
        //  firstName : user.firstName,
        //  lastName : user.lastName,
        userName : userName,
        //  email : user.email,
         college : req.body.college,
         dob : req.body.dob,
         country : req.body.country,
         city: req.body.city,
        });
      //Create new user and add to database
      Profile.create(profileObject,function(err,newProfile){
        if(err){
          console.log(err);
        }else{
          res.status(400).json(newProfile);
          res.redirect("/profile");
        }
      })
    }
  });
});

app.post("/addQuestion", (req, res)=> {
  const newQuestion = new Question({
    quesName: req.body.quesName,
    quesLink: req.body.quesLink,
    quesType: req.body.quesType
  })

  newQuestion.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.redirect("/addQuestion");
    }
  })

})

function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele != value;
    });
}

app.post("/questions", (req, res)=> {
  const questionName = req.body.questionName;
  const solvedStatus = req.body.solvedStatus;

  console.log(questionName);
  console.log(solvedStatus);


  const id = localStorage.getItem('id');

  User.findOne({_id: id}, function(err, foundOne){
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
      res.redirect("/questions");
    }
  })
})




// ***************************************ALL THE GET REQUEST ARE BELOW ****************************************************

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

// Sends the list of Questions
app.get("/questions", requireAuth, (req, res)=>{

  Question.find({}, function(err, questions){
    if(err){
      console.log(err);
    }else{
      const userName = localStorage.getItem('userName');
      const questionList = questions

      console.log(userName);

      User.findOne({userName: userName}, function(err, foundOne){
        if(err){
          console.log(err);
        }else{
          console.log(foundOne);
          const solvedQuestions = foundOne.solvedQuestions;

          //console.log(questionList);
          //console.log(solvedQuestions);

          res.render("questions.ejs", {questionList: questionList, solvedQuestions: solvedQuestions, questionTypes: questionTypes});
        }
      })

    }
  })




});

app.get("/chatroom", requireAuth, (req, res)=>{
  res.render("chatroom.ejs");
});

app.get("/leaderboard", requireAuth, (req, res)=>{

  User.find({}, (err, users)=> {
    if(err){
      console.log(err);
    }else {
      console.log(users);

      users.sort((a,b) => (a.solvedQuestions.length < b.solvedQuestions.length) ? 1 : ((b.solvedQuestions.length < a.solvedQuestions.length) ? -1 : 0))

      console.log(users);
      res.render("leaderboard", {users: users});
    }
  })

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

app.get("/addQuestion", (req, res)=> {
  res.render("addQuestion.ejs");
})


// *************************************************listening ****************************************************************
app.listen(3000, function(){
  console.log("server listening on 3000");
})


//****************************************************Rough Work ***************************************************************

//
// for(let i=0; i<questionTypes.length; i++){
//   //print the type and heading
//
//   for(let j=0; j<questionList.length; j++){
//     if(questionList[j].quesType === questionTypes[i]){
//
//       //check if it exist in the solved array of student
//       let exist = false;
//       for(let k=0; k<solvedQuestions.length; k++){
//         if(questionList[j]._id === solvedQuestions[k]){
//           exist = true;
//           break;
//         }
//       }
//
//       if(exist){
//         //print solved
//       }else{
//         //print not solved
//       }
//
//     }
//   }
// }
