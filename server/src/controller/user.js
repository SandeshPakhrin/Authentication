// Register

import { redisClient } from "../../index.js";
import { registerSchema } from "../config/zod.js";
import tryCatch from "../middlewares/tryCatch.js";
import sanitize from "mongo-sanitize";
import { User } from "../model/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getVerifyEmailHtml } from '../config/templete.js';

export const registerUser = tryCatch(async(req,res,next)=>{
    const sanitazeBody = sanitize(req.body);

    const validation = registerSchema.safeParse(sanitazeBody);
    if(!validation.success){
        return res.status(400).json({
            message:"Validation Error",
        })
    }

    const {name,email,password}= validation.data;

    const rateLimit = `register-rate-limit:${req.ip}:${email} `

    if( await redisClient.get(rateLimit)){
        return res.status(429).json({
            message:"Too many requests. Please try again later.",
        })
    }

    const existingUser = await User.findOne({ email });

    if(existingUser){
        return res.status(400).json({
            message:'User already exists',
        })
    }

    const hashedPassword = await bcrypt.hash(password,10)

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyKey = `verify-email:${verifyToken}`;

    const dataStore = JSON.stringify({
        name,
        email,
        password:hashedPassword
    })
    
    await redisClient.set(verifyKey,dataStore,{EX:300});

    const subject = "Verify your email for your Account Registration";
    const html = getVerifyEmailHtml({email,token:verifyToken});

    await sendMail({email,subject,html})

    await redisClient.set(rateLimit,"true",{EX:60})

    res.status(201).json({
        message:'If your email is valid, a verification link han been sent. It will expires in 5 minutes.',
    })
})






// Login










// Get User Profile