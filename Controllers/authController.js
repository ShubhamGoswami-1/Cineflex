const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('./../Utils/CustomError');
const util = require('util');
const sendEmail = require('./../Utils/email');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({id}, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    });
}

exports.signup = asyncErrorHandler ( async (req, res, next) => {
    const newUser = await User.create(req.body);

    const token = signToken(newUser._id);

    res.status(201).json({
        status: "Success",
        token,
        data: {
            user: newUser
        }
    });
});

exports.login = asyncErrorHandler(async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    // const {email, password} = req.body;
    // Check if email and password is present in request body
    if(!email || !password){
        const error = new CustomError('Please provide email ID & password for login IN!', 400);
        return next(error);
    }

    // Check if user exists with given mail
    const user = await User.findOne({email}).select('+password');

    // const isMatch = await user.comparePasswordInDb(password, user.password);

    //Cehck if the user exists & password matches
    if(!user || !(await user.comparePasswordInDb(password, user.password))){
        const error = new CustomError('Incorrect email or password', 400);
        return next(error);
    }

    const token = signToken(user._id);

    res.status(200).json({
        status: "Success",
        token
    });
});

exports.protect = asyncErrorHandler(async (req, res, next) => {
    
    //1. Read the token and check if it exists
    const testToken = req.headers.authorization;
    let token;
    if(testToken && testToken.startsWith('Bearer')){
        token = testToken.split(' ')[1];
    }
    if(!token){
        next(new CustomError('You are not logged in! :(', 400))
    }

    //2. Validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);
  
    //3. If the user exists (If the user logedin and after theat user get deleted from records)
    const user = await User.findById(decodedToken.id);

    if(!user){
        const error = new CustomError('The user with the given token doesnt exists! :(', 401);
        next(error);
    }

    //4. If the user changed password after the token was issued
    const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);
    if(isPasswordChanged){
        const error = new CustomError('The passowrd has been changed recently. Please login again!!! :(', 401);
        return next(error);
    }

    //5. Allow users to access the routes
    req.user = user;
    next();
});

exports.restrict = (role) => {
    return (req, res, next) => {
        if(req.user.role !== role){
            const error = new CustomError('You do not have permission to perform this action ! ', 403);
            next(error);
        }
        next();
    }
}

// exports.restrict = (...role) => {
//     return (req, res, next) => {
//         if(!role.includes(req.user.role)){
//             const error = new CustomError('You do not have permission to perform this action ! ', 403);
//             next(error);
//         }
//         next();
//     }
// }

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    //1. Get user based on posted email
    const user = await User.findOne({email: req.body.email});

    if(!user){
        const error = new CustomError('We could not find the user with the given email!  :(', 404);
        next(error);
    }

    //2. Generate a random reset token
    const resetToken = user.createResetPasswordToken();

    await user.save({validateBeforeSave: false});

    //3. Send the token back to the user email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `We have recieved a password reset request. Please use the below link to reset your password\n\n${resetUrl}\n\nThis reset password link wiii be valid only for 10 minutes.`;
    try {
        await sendEmail({
            email: user.email,
            subject: 'Password change request recieved',
            message: message
        });

        res.status(200).json({
            status: "Success",
            message: "password reset link send to the user email"
        });

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({validateBeforeSave: false});

        return next(new CustomError('There was an error sending password reset email. Please try again later! :(', 500));
    }
    

})

exports.resetPassword = asyncErrorHandler( async (req, res, next) => {
    //1. If the user exists with given token & token has not expired
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: token, passwordResetTokenExpires: {$gte: Date.now()}});

    if(!user){
        const error = new CustomError('Token is invalid or has expired! :(', 400);
        next(error);
    }

    //2. Reseting the user password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    //3. Login the user
    const loginToken = signToken(user._id);

    res.status(200).json({
        status: "Success",
        token: loginToken
    });
})