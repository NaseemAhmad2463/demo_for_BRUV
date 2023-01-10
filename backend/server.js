const app = require("./app");

const dotenv = require("dotenv");
const connectDatabase = require("./config/database")

// Handle Uncaught Error (ex: console.log(product) and product is not defined yet.)

process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to Uncaught Exception");
    server.close(() => {
        process.exit(1);
    });
})
//config

dotenv.config({path:"backend/config/config.env"});

//Connecting to database
connectDatabase()

const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on http://localhost:${process.env.PORT}`)
})


// Unhandled Promise Rejection (If database url is not correct)

process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console.log("Shutting down the server due to Unhandled Promise Rejection");

    server.close(() => {
        process.exit(1);
    });
});