// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: "./env"
})

const port = process.env.PORT || 8080

connectDB()
.then(() => {
    app.listen(port, () => {
        console.log(`⚙️  Server is running at port : ${port}`);
    } )
    app.on("error", (error) => {
        console.log("App is not connected!!",error);
        throw error
        
    })
})
.catch((error) => {
    console.log("MONGO DB Connection is Failed!!!!", error);
    
})





























/*
first approach to connect to the database

import express from "express";
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log(error)
            throw error
        })
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`)
        })
    } catch (error) {
        console.log(error)
        throw error
    }
})()

*/