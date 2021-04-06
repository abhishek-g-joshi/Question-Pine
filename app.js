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
const Message = require("./models/Message");
const Discussion = require("./models/Discussion");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser, checkErrors } = require("./middleware/authMiddleware");
const { google } = require('googleapis');
const dotenv = require('dotenv').config();
const crypto = require("crypto");
var async = require('async');
var path = require('path');
const exphbs = require("express-handlebars");
var  hbs = require('nodemailer-express-handlebars'),
  email = process.env.MAILER_EMAIL_ID ,
  nodemailer = require('nodemailer');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token : REFRESH_TOKEN})

const app = express();


const questionTypes = ["Array","String","Matrix","Linked List","Stack","Queue","Tree","Graph","Greedy","Backtracking","Recursion","Dynamic Programing","Bit Manipulation","Hash Table","Sort","Searching","Map","Segment Tree"];
const requestedDiscussionArray = [];


app.engine('handlebars', exphbs());
app.set('view engine', 'ejs','handlebars');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.use(express.static("views"));
app.use(cookieParser());



const accessToken = oAuth2Client.getAccessToken();

let transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		type: 'OAuth2',
		user: email,
		clientId: CLIENT_ID,
		clientSecret: CLIENT_SECRET,
		refreshToken: REFRESH_TOKEN,
		accessToken: accessToken,
	},
});



const validateSignUpInputs = require("./validation/signup");
const validateSignInputs = require("./validation/signin");
const Users = require("./models/Users");
const signin = require("./validation/signin");
const Questions = require("./models/Questions");


// mongoose.connect(process.env.MONGO_URI,
// {
//   dbName : process.env.DB_NAME,
//   user: process.env.MONGO_USER,
//   pass: process.env.MONGO_PASSWORD,
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false
// }
// );

mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});


const secreteKey = process.env.SECRETE_KEY;

const createToken = (id,expIn) =>{
  return jwt.sign({id},secreteKey,
  {expiresIn: expIn});
}


// *****************************************************ALL THE POST REQUEST BELOW ************************************************
app.post("/", (req,res)=>{
  res.redirect("/homepage");
})
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
       reqDiscussions: arr,
       activeDiscussions: arr
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
  //  const auth =  checkErrors(req.body);

  if(!isValid)
  {
    // return res.status(400).json(errors);
    console.log(errors);
    res.locals.errors = errors;
    // return res.redirect('/signin');
    res.render('signIn',{errors:errors})
  }

  const email = req.body.email;
  const password = req.body.password;
  const rememberMe  = req.body.rememberMe;
  console.log(rememberMe);

  //find user by email
  User.findOne({email})
    .then(user =>{
      if(!user)
      {
        errors.email = "User not found";
        return res.status(400).json(errors)
      }else{
          //check password
          bcrypt.compare(password,user.password)
          .then(isMatch => {
            if(isMatch){
            if(rememberMe)
            {
              const expIn = 720*3600;
              const token = createToken(user._id,expIn);
              res.cookie('jwt', token, { maxAge: expIn * 1000 });
            }else{
              const expIn = 3600;
              const token = createToken(user._id,expIn);
              res.cookie('jwt', token, { maxAge: expIn * 1000 });
            }

            console.log({ user : user._id });
            res.redirect("/questions/" + user.userName );
          }else{
            errors.password= 'password incorrect';
            return res.status(400).json(errors);
          }
        });
      }
    });
})


// forgot password post route
app.post("/forgot-password",(req,res)=>{

  async.waterfall([
    function(done) {
      User.findOne({
        email: req.body.email
      }).exec(function(err, user) {
        if (user) {
          done(err, user);
        } else {
          done('User not found.');
        }
      });
    },
    function(user, done) {
      // create the random token
      crypto.randomBytes(50, function(err, buffer) {
        var token = buffer.toString('hex');
        done(err, user, token);
      });
    },
    function(user, token, done) {
      User.findByIdAndUpdate({ _id: user._id }, { reset_password_token: token, reset_password_expires: Date.now() + 20*60*1000 }, { upsert: true, new: true }).exec(function(err, new_user) {
        done(err, token, new_user);
      });
    },
    function(token, user, done) {
      var  context =  {
        url: CLIENT_URL+'/reset-password/' + token,
        name: user.userName
      };
      var data = {
        from: 'Question Pine <' + email + '>',
        to: user.email,
        subject: 'Password help has arrived!',
        html:`
        <h3>Dear ${context.name},</h3>
        <p>You requested for a password reset, kindly use this <a href="${context.url}">link</a> to reset your password</p>
        <br>
        <p>This link valid for only 20 minutes.</p>
        <p>Cheers!</p>
        `,

      };
      // console.log({userData:data});
      transporter.sendMail(data, function(err) {
        if (!err) {
          // console.log({userData:data});
          return res.json({ message: 'Kindly check your email for further instructions' });
        } else {
          return done(err);
        }
      });
    }
  ],
  function(err) {
    return res.status(422).json({ message: err });
  });
});

//reset password POST route
app.post("/reset-password",(req,res,next)=>{

  if (req.body.password === req.body.confirmPassword) {
    const filter = {reset_password_token: req.body.token,
      reset_password_expires: {
        $gte: Date.now()
      }
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const update = {
      reset_password_token : undefined,
      reset_password_expires : undefined,
      password : hash
    }

  User.findOneAndUpdate(filter,update,{new:true}
    ).exec(function(err, user){
    // console.log({user:user});
    if (!err && user) {

        var data = {
          from: 'Question Pine <' + email + '>',
          to: user.email,
          subject: 'Password Reset Confirmation',
          html:`
            <h3>Dear ${user.userName},</h3>
            <p>Password reset Successfully Done!</p>
            <br>
            <p>Cheers!</p>
            `
        };
        transporter.sendMail(data, function(err) {
          if (!err) {
            res.json({ message: 'Password reset' });
            return res.redirect('/signin')
          } else {
            return done(err);
          }
        });

      }else {
        return res.status(400).send({
          message: 'Password reset token is invalid or has expired.'
        });
      }
    });
  }else{
    return res.status(422).send({
      message: 'Passwords do not match'
    });
  }
});

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

app.post("/discussion/:userName/create",requireAuth, (req, res)=> {
  const creator = req.params.userName;
  const name = req.body.name;
  const description = req.body.description;

  Discussion.findOne({discussionID: name+"_"+creator}, (err, findOne)=> {
    if(findOne){
      console.log("Already exist");
    }else{
      const newDis = new Discussion({
        discussionID: name+"_"+creator,
        discussionName: name,
        admin: creator,
        description: description,
        currentMembers: [creator],
        requestedMembers: [],
        msgArray: []
      })

      newDis.save();
      // res.redirect("/discussion/"+creator);
    }
  });
  Users.findOne({userName:creator},(err,user)=>{
    if(err){
      console.log(err.message);
    }else{
      user.activeDiscussions.push(name+"_"+creator);
    }
    user.save();
    res.redirect("/discussion/"+creator);

  })
})

//POST route to addmember in discussion
app.post("/discussion/:userName/:discussion/addmembers", requireAuth, (req, res)=>{
  const discussionName = req.body.discussionName;
  const admin = req.body.admin;
  const discussionID = req.body.discussionID;
  const newMember = req.body.newMember;
  Discussion.findOne({discussionID},(err,foundDiscussion)=>{
    if(err){
      return res.status(400).json(err);
    }
    else{
      //  foundDiscussion.requestedMembers.forEach(member => {
      //    if(member === newMember){
      //      console.log('already  requested');
      //       res.redirect("/discussion/"+admin+"/"+discussionName+"/addmembers");
      //       const error = 'already  requested';
      //       // return res.status(400).json(error);
      //    }
      //    else{

      //    }
      //  });
      foundDiscussion.requestedMembers.push(newMember);
          foundDiscussion.save();
          User.findOne({userName:newMember},(err,foundUser)=>{
            if(err){
              console.log(err.message);
            }
            else{
              // console.log({user:foundUser});
              foundUser.reqDiscussions.push(discussionID);
              foundUser.save();
              res.redirect("/discussion/"+admin+"/"+discussionName+"/addmembers");
            }
          })
    }
  })

    // console.log("member added successfully")
    // console.log(discussionID);
})

//POST route to accept or deny request of discussion
app.post("/:userName/notifications",requireAuth,(req,res)=>{
  const userName = req.params.userName;
  const discussionID = req.body.discussionID;
  User.findOne({userName},(err,foundUser)=>{
    if(err){
      console.log(err.message);
    }else{
      // console.log(foundUser);
      foundUser.reqDiscussions = arrayRemove(foundUser.reqDiscussions,discussionID);
      foundUser.activeDiscussions.push(discussionID);
      foundUser.save();
      Discussion.find({},(err,foundDiscussions)=>{
        if(err){
          console.log(err.message);
        }else{
          console.log(foundDiscussion);
          foundDiscussion.requestedMembers = arrayRemove(foundDiscussion.requestedMembers,userName);
          foundDiscussion.currentMembers.push(userName);
          foundDiscussion.save();
          res.redirect("/"+userName+"/notifications");
        }
      })

    }
  })
})

// ***************************************ALL THE GET REQUEST ARE BELOW ****************************************************

//check current user
app.get("*",checkUser);

// app.get("*",checkErrors);


//singin route
app.get("/signin",(req,res)=>{
  // res.locals.errors = null;
  const errors = {}
  res.render("signIn.ejs",{errors:errors});
})

//Signout routes
app.get("/signout",(req,res)=>{
  res.cookie('jwt','', {maxAge:1});
  res.redirect("/homepage");
})

// app.use("/api/users",users);



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

//forgot password get route
app.get("/forgot-password",(req,res)=>{
  res.render("forgotPassword.ejs");
})

app.get("/reset-password/:token",(req,res)=>{

  const token = req.params.token;
  res.render("reset-password.ejs",{token:token});
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
        // const userID = req.params.id;
        const questionList = questions;
        const userName = req.params.userName;
        // console.log({user_id: userID});

        User.findOne({userName}, function(err, foundOne){
          if(err){
            console.log(err);
          }else{
            // console.log(foundOne);
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
        // const userID = req.params.id;
        const questionList = questions;
        const userName = req.params.userName;
        // console.log(userID);

        User.findOne({userName}, function(err, foundOne){
          if(err){
            console.log(err);
          }else{
            // console.log(foundOne);
            const solvedQuestions = foundOne.solvedQuestions;

            res.render("questions.ejs", {questionList: questionList, solvedQuestions: solvedQuestions, questionTypes: questionTypes});

          }
        })

      }
    })
  }
});

app.get("/discussion/:userName/create", requireAuth, (req, res)=>{
  //console.log(req.params.userName);
  res.render("createDiscussionForm.ejs", {creatorUserName: req.params.userName});
});

//print only users discussion: not complete
app.get("/discussion/:userName", checkUser, (req, res)=>{
  const userName = req.params.userName;

  res.render("discussions.ejs",{creatorUserName: req.params.userName});
});

// add members to a particular group
//[have to add the specific groupname in the url]
app.get("/discussion/:userName/:discussion/addmembers", requireAuth, (req, res)=>{
  const activeDiscussion = req.params.discussion;
  const admin = req.params.userName;
  const discussionID = activeDiscussion;
  // console.log(discussionID);
  if(req.query.search)
  {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    User.find({userName: regex}, (err, users)=> {
      if(err){
        console.log(err);
      }else {
        User.find({}, (err, users)=> {
          if(err){
            console.log(err);
          }else {
            Discussion.findOne({discussionID:discussionID},(err,discussion)=>{
              if(err)
              {
                console.log('Not found discussion');
              }
              else{
                const requestedList = discussion.requestedMembers;
                const acceptedList = discussion.currentMembers;
                console.log(requestedList);
                 res.render("addMembers.ejs", {users: users,admin:admin,activeDiscussion:activeDiscussion,requestedList,acceptedList});
              }

            })

          }
        })
      }
    })
  }
  else{
    User.find({}, (err, users)=> {
      if(err){
        console.log(err);
      }else {
        Discussion.findOne({discussionID:discussionID},(err,discussion)=>{
          if(err)
          {
            console.log('Not found discussion');
          }
          else{
            const requestedList = discussion.requestedMembers;
            const acceptedList = discussion.currentMembers;
            console.log(requestedList);
             res.render("addMembers.ejs", {users: users,admin:admin,activeDiscussion:activeDiscussion,requestedList,acceptedList});
          }

        })

      }
    })
  }

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
app.get("/:id", requireAuth, function(req, res){
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

//notification GET route
app.get("/:userName/notifications", requireAuth, function(req, res){
  const userName = req.params.userName;
  User.findOne({userName},(err,foundUser)=>{
    if(err){
      console.log(err.message);
    }else{
      const reqDiscussions = foundUser.reqDiscussions;
      Discussion.find({},(err,foundDiscussions)=>{
        if(err){
          console.log(err);
        }else{
          const requestedDiscussionArray = [];
          //console.log(reqDiscussions);
          //console.log(foundDiscussions);

          for(let i=0; i<reqDiscussions.length; i++){
            for(let j=0; j<foundDiscussions.length; j++){
              if(reqDiscussions[i] === foundDiscussions[j].discussionID){
                requestedDiscussionArray.push(foundDiscussions[j]);
              }
            }
          }
          console.log(requestedDiscussionArray);

          res.render("notifications.ejs", {requestedDiscussionArray: requestedDiscussionArray});
        }
      })
    }
  })
})




// *************************************************listening ****************************************************************
const PORT = process.env.PORT || 3000;

app.listen(PORT, function(){
  console.log("server listening on " + PORT);
})





/***************************************Rough Work for testing: DO NOT DELETE *********************************************/

// async function getsolvedQuestionObject(user){
//     try{
//       const foundOne = User.findOne({userName:user});
//       const solvedQuestions = foundOne.solvedQuestions;
//       var solvedQuestionObject = [];
//       for(let i=0;i<solvedQuestions.length;i++)
//       {
//         var foundQuestionOne=await Question.findOne({quesName:solvedQuestions[i]});
//         solvedQuestionObject.push(foundQuestionOne);
//       }
//     }
//     catch(error){
//       console.log(error);
//     }
// }
//------------profile route changes-------------
// app.get("/:id/", requireAuth, function(req, res){
//   const userName = req.params.id;
  // var solvedQuestions=[];
  // // const userOne = {};
  // //const solvedQuestionObject= getsolvedQuestionObject(userName);
  // User.findOne({userName},(err,foundOne)=>{
  //   if(err)
  //   {
  //     console.log(err);
  //   }
  //   else
  //   {
  //     //userOne=foundOne;
  //     solvedQuestions = foundOne.solvedQuestions;
  //     //console.log(solvedQuestions);
  //   }
  // })

  //   // const solvedQuestions = userOne.solvedQuestions;
  //   // console.log(solvedQuestions);
  //   var solvedQuestionObject = [];
  //   for(let i=0;i<solvedQuestions.length;i++)
  //   {

  //     Question.findOne({quesName: solvedQuestions[i]},(err,foundQues)=>{
  //       if(err)
  //       {
  //         console.log(err.message);
  //       }
  //       else
  //       {
  //         //var solvedQues  = {};
  //         // solvedQues['quesName']= foundQues.quesName;
  //         // solvedQues['quesLink']= foundQues.quesLink;
  //         // solvedQues['quesType']= foundQues.quesType;

  //         //console.log(solvedQues);
  //         solvedQuestionObject.push({
  //           quesName: foundQues.quesName,
  //           quesLink: foundQues.quesLink,
  //           quesType: foundQues.quesType
  //         });
  //       }
  //       //console.log(solvedQues);

  //     })
  //       solvedQuestionObject.push(foundQuestionOne);
  //   }
  // var solvedQuestionObject = new Array();
  //   User.findOne({userName})
  //     .then(foundOne=>{
  //       const solvedQuestions = foundOne.solvedQuestions;
  //       for(var i=0;i<solvedQuestions.length;i++)
  //       {
  //         Question.findOne({quesName:solvedQuestions[i]})
  //           .then(foundQues=>{
  //             solvedQuestionObject.push(foundQues)
  //           });
  //       }
  //       console.log(solvedQuestionObject);
  //     });
  //  console.log(solvedQuestionObject);
  //res.render("profile.ejs",{userData: foundOne,solvedQuestionObject: solvedQuestionObject});

// })

// var solvedQuestionObject = new Array();
//
// async function getsolvedQuestionObject(user){
//   try{
//     const foundOne = User.findOne({userName:user});
//     const solvedQuestions = foundOne.solvedQuestions;
//     // var solvedQuestionObject = [];
//     for(let i=0;i<solvedQuestions.length;i++)
//     {
//       var foundQuestionOne=await Question.findOne({quesName:solvedQuestions[i]});
//       solvedQuestionObject.push(foundQuestionOne);
//     }
//   }
//   catch(error){
//     console.log(error);
//   }
// }
//
//
// const msg = new Message({
//   userName:"x",
//   Datetime: Date(),
//   content: "Hi"
// })
//
// const newDis = new Discussion({
//   discussionID: "x",
//   discussionName: "y",
//   currentMembers: ["x", "y"],
//   requestedMembers: ["z"],
//   msgArray: [msg]
// })
//
// newDis.save();
