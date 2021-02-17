const jwt = require('jsonwebtoken');
const User = require("../models/Users");
const dotenv = require('dotenv').config();

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
                console.log(decodedToken.id);
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
                console.log(decodedToken);
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

module.exports = { requireAuth, checkUser };