const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const { Error } = require("mongoose");
// Register a User

exports.registerUser = catchAsyncErrors( async(req,res,next) => {
    const {name,email,password} = req.body;

    const user = await User.create({
        name,email,password,
        avatar:{
            public_id:"This is a sample id",
            url:"profilepicurl"
        }
    });

    sendToken(user, 201 ,res);
})

// Login User

exports.loginUser = catchAsyncErrors(async(req, res, next) => {
    const {email, password} = req.body;

    // Checking if user has given password and email both

    if (!email || !password){
        return next(new ErrorHandler("Please enter both email & password", 400));
    }

    const user = await User.findOne({email:email}).select("+password");

    if (!user){
        return next(new ErrorHandler("Invalid email and/or password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched){
        return next(new ErrorHandler("Invalid email and/or password", 401));
    }

    sendToken(user, 200, res);
});

// Logout User

exports.logoutUser = catchAsyncErrors(async(req,res,next) => {
     
    res.cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly: true
    });
    
    res.status(200).json({
        success: true,
        message: "Logged Out"
     });
});

// Forgot Password

exports.forgotPassword = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email});

    if(!user){
        return next(new ErrorHandler("User not found", 404));
    }

    // Get Reset Password Token

    const resetToken = user.getResetPasswordToken();

    await user.save({validateBeforeSave: false});

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;

    const message = `Your password reset token is :- \n\n${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

    try {

        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,
            message
        });

        res.status(200).json({
            success:true,
            message: `Email sent to ${user.email} successfully`
        });
        
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        
        await user.save({validateBeforeSave: false});

        return next(new ErrorHandler(error.message,500));
    }
});

// Reset Password

exports.resetPassword = catchAsyncErrors(async(req,res,next)=>{
   
    // Creating token's hash 
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({resetPasswordToken:resetPasswordToken, resetPasswordExpire: {$gt: Date.now()}})

    if (!user){
        return next(new ErrorHandler("Reset password token is invalid or has been expired", 400));
    }
    
    if (req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Confirm password is not same as password",400))
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
        
    await user.save();

    sendToken(user, 200, res);
});

// Get User Detail

exports.getUserDetails = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
        success:true,
        user
    });
});

// Upate Password

exports.updatePassword = catchAsyncErrors(async(req,res,next)=>{
    
    const {oldPassword, newPassword, confirmPassword} = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(oldPassword);

    if (!isPasswordMatched){
        return next(new ErrorHandler("Old password is incorrect",400));
    }

    if (newPassword !== confirmPassword) {
        return next(new ErrorHandler("Password doesn't match", 400));
    }

    user.password = newPassword;

    await user.save();

    sendToken(user, 200, res);
});

// Update User Profile

exports.updateProfile = catchAsyncErrors(async(req,res,next)=>{
    
    const userNewData = {
        name:req.body.name,
        email:req.body.email
    };

    // We will add cloudinary later

    const user = await User.findByIdAndUpdate(req.user.id, userNewData, {
        new: true,
        runValidators: true,
        userFIndAndModify: false
    });

    res.status(200).json({
        success: true,
        user
    });
});

// Get all users (admin)

exports.getAllUsers = catchAsyncErrors(async(req,res,next)=>{
    const users = await User.find();

    res.status(200).json({
        success:true,
        users
    });
});


// Get Single User Detail (admin)

exports.getSingleUser = catchAsyncErrors(async(req,res,next)=>{
    const user = await User.findById(req.params.id);
    
    if (!user){
        return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`,400));
    }

    res.status(200).json({
        success:true,
        user
    });
});

// Update User (admin)

exports.updateUserRole = catchAsyncErrors(async(req,res,next)=>{
    
    const userNewData = {
        name:req.body.name,
        email:req.body.email,
        role:req.body.role
    };


    const user = await User.findByIdAndUpdate(req.params.id, userNewData, {
        new: true,
        runValidators: true,
        userFIndAndModify: false
    });

    res.status(200).json({
        success: true,
        user
    });
});

// Delete User (admin)

exports.deleteUserProfile = catchAsyncErrors(async(req,res,next)=>{
    
    const user = await User.findById(req.params.id)
    // We will remove cloudinary later

    if (!user){
        return next(new ErrorHandler(`User does not exist with id: ${req.params.id}`,400));
    }

    await user.remove();

    res.status(200).json({
        success: true,
        message:"User deleted successfully."
    });
});