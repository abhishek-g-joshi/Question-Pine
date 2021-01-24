const express = require(`express`);
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const User = require("../../models/Users");

const validateSignUpInputs = require("../../validation/signup");
const validateSignInputs = require("../../validation/signin");

router.get('/test', (req,res) => {
    console.log("tested");
    res.json({ msg : 'user work'})}
);




module.exports = router; 