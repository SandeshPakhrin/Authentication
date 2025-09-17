import express from 'express';
import connectDB from './src/connectDB/connectDB.js';
import userRouter from './src/router/user.js';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

// Load environment variables at the very beginning
dotenv.config()

console.log('Environment variables loaded:');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Not set');
console.log('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Not set');

const app =  express();


app.use(express.json())
app.use(cookieParser())

const redisUrl = process.env.REDIS_URL;
if(!redisUrl){
    console.log('Redis URL missing ')
    process.exit(1);
}
export const redisClient = createClient({
    url:redisUrl,
})

redisClient.connect().then(()=>{
    console.log('Redis connected')
}).catch(console.error)

const port = 2000;

await connectDB();

app.listen(port,()=>{
    console.log(`Server is running on the port ${port}`)
})


app.use('/user',userRouter);