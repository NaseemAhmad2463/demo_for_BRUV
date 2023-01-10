const ErrorHandler = require("../utils/errorhandler");

module.exports = (err, req, res, next) => {
    err.statuscode = err.statuscode || 500;
    err.message = err.message || "Internal Server Error";

    // Wrong Mongodb Id error (if wrong id is passed)
    if (err.name === "CastError") {
        const message = `Resource not found. Invlaid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    }

    // Mongoose duplicate key error
    if (err.code === 11000){
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message, 400);
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError"){
        const message = `JSON Web Token is invalid, try again`;
        err = new ErrorHandler(message,400);
    }

    // JWT expire error
    if (err.name === "TokenExpiredError"){
        const message = `JSON Web Token is expired, try again`;
        err = new ErrorHandler(message,400);
    }

    res.status(err.statuscode).json({
        success:false,
        message:err.message
    })
}