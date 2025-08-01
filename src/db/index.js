import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

 const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n⚙️  MONGODB connected successfully!! \n ${connectionInstance.connection.host}`);
        // console.log(connectionInstance);
        
    } catch (error) {
        console.log("MONGODB Connection Declined!!!!", error)
        // throw error
        process.exit(1)
    }
}

export default connectDB