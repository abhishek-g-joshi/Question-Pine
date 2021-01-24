const Validator = require("validator");
const isEmpty = require("./is-empty");

module.exports = function validateRegisterInput(data)
{
    let errors = {};

    data.firstName = !isEmpty(data.firstName)?data.firstName: '';
    data.lastName = !isEmpty(data.lastName)?data.lastName: '';
    data.userName = !isEmpty(data.userName)?data.userName: '';
    data.email = !isEmpty(data.email) ? data.email : '';
    data.password = !isEmpty(data.password) ? data.password : '';
    data.confirmPassword = !isEmpty(data.confirmPassword)?data.confirmPassword:'';

    if(!Validator.isLength(data.firstName, {min:3, max:30})){
        errors.firstName = "Name must be between 3 to 30 characters.";
    }

    if(Validator.isEmpty(data.firstName))
    {
        errors.firstName = "First name field is required";
    }

    if(!Validator.isLength(data.lastName, {min:3, max:30})){
        errors.lastName = "Name must be between 3 to 30 characters.";
    }

    if(Validator.isEmpty(data.lastName))
    {
        errors.lastName = "Last name field is required";
    }

    if(!Validator.isLength(data.userName, {min:2, max:15})){
        errors.userName = "Name must be between 2 to 15 characters.";
    }

    if(Validator.isEmpty(data.userName))
    {
        errors.userName = "User name field is required";
    }

    if(Validator.isEmpty(data.email))
    {
        errors.email = "Email field is required";
    }

    if(!Validator.isEmail(data.email))
    {
        errors.email = "Email is invalid";
    }

    if (!Validator.isLength(data.password, { min: 8, max: 20 })) 
    {
        errors.password = 'Password must be at least 8 characters';
    }

    if(Validator.isEmpty(data.password))
    {
        errors.password = "Password field is required";
    }
    
    if(Validator.isEmpty(data.confirmPassword))
    {
        errors.confirmPassword = "Confirm Password field is required";
    }

    if(!Validator.equals(data.password, data.confirmPassword))
    {
        errors.confirmPassword = 'Password must match';
    }

    return{
        errors,
        isValid: isEmpty(errors)
    };
};

