import mongoose from "mongoose"

const connectDB = async()=>{
    try {
        await mongoose.connect('mongodb://localhost:27017/authentication');
       console.log('Database connected');
    } catch (error) {
        console.log('Database connection failed');
    }
}

export default connectDB;