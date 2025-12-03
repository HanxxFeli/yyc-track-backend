/**
 * MongoAtlas databse connection
 * 
 * establish connection to MongoAtlas databse
 * maintain connection to MongoAtlas when server starts
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    // Create the connection to the database using URI
    try { 
        const conn = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`Connection to YYC-TRACK DB is a Success: ${conn.connection.host}`) // log the host connection
    } 
    catch (error) { 
        console.error(`Error: ${error.message} `)
        process.exit(1) // exit the process if it fails
    }
    
}

module.exports = connectDB;