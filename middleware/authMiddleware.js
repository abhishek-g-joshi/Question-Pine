const jwt = require('jsonwebtoken');
const User = require("../models/Users");

const requireAuth = (req,res,next) => {
    const token = req.cookies.jwt;

    //Check JSON web token exist and verified
    if(token){
        jwt.verify(token,'shhhaaSecretKey',(err,decodedToken)=> {
            if(err)
            {
                console.log(err.message);
                res.redirect("/signin");
            } else{
                console.log(decodedToken);
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
        jwt.verify(token,'shhhaaSecretKey',async (err,decodedToken)=> {
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