const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const CustomError = require('./../Utils/CustomError');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) {
            newObj[el] = obj[el];
        }
    })
    return newObj;
}

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "Success",
        results: users.length,
        data: {
            users
        }
    });
})

exports.updateMe = asyncErrorHandler( async (req, res, next) => {
    // 1) Create Error if user POSTs password data 
    if(req.body.password || req.body.confirmPassword){
        return next (new CustomError(`This route is not for updating password. Please use /updateMyPassword`, 400))
        // for updating or resteing password we have the routes defined in authController
        // Here we just update the user data, That is only name or email
    }

    // 2) Filtered out unwanted field names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
        status: "success",
        data: null
    })
});

exports.createUser = (req, res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is yet not defined"
    });
}

exports.getUser = (req, res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined"
    });
}

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined"
    });
}

exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined"
    });
}