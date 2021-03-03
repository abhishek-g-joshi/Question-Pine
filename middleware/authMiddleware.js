const jwt = require('jsonwebtoken');
const User = require("../models/Users");
const dotenv = require('dotenv').config();
const validateSignUpInputs = require("../validation/signup");
const validateSignInputs = require("../validation/signin");
const secreteKey = process.env.SECRETE_KEY;

const requireAuth = (req,res,next) => {
    const token = req.cookies.jwt;

    //Check JSON web token exist and verified
    if(token){
        jwt.verify(token,secreteKey,(err,decodedToken)=> {
            if(err)
            {
                console.log(err.message);
                res.redirect("/signin");
            } else{
                console.log({reqAuth: decodedToken.id});
                next();
            }
        })
    }else{
        res.redirect("/signin");
    }
}

//Check current user 
const checkUser = (req,res,next) => {
    const token = req.cookies.jwt;

    //Check JSON web token exist and verified
    if(token){
        jwt.verify(token,secreteKey,async (err,decodedToken)=> {
            if(err)
            {
                console.log(err.message);
                res.locals.user = null;
                next();
            } else{
                console.log({checkuser: decodedToken});
                let user = await User.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
        })
    }else{
        res.locals.user = null;
        next();
    }

}

// check errors
const checkErrors = (data) => {
    const errors = validateSignInputs(data);
    if(errors)
    {
        console.log(errors);
        // locals.errors = errors;
        // next();
    }else{
        // locals.errors = null;
        // next();
    }
}

module.exports = { requireAuth, checkUser, checkErrors };