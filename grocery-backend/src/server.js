import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";


const PORT = process.env.PORT ||5000;

const startServer = async() =>{
    await connectDB();

    app.listen(PORT ,"0.0.0.0", ()=>{
        console.log(`Server running on port ${PORT}`)
    })
}


startServer()
    .catch((error) =>{
        console.error("FATAL ERROR: Server failed to start", error.message);
        process.exit(1);
    });
