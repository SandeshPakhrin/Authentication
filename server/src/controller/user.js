// Register

import { redisClient } from "../../index.js";
import { loginSchema, registerSchema } from "../config/zod.js";
import tryCatch from "../middlewares/tryCatch.js";
import sanitize from "mongo-sanitize";
import { User } from "../model/user.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../config/sendMail.js";
import { getOtpHtml, getVerifyEmailHtml } from '../config/templete.js';
import { success } from "zod";
import { generateAccessToken, generateToken, verifyRefreshToken } from "../config/generateToken.js";

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

export const verifyUser = tryCatch(async(req,res,next)=>{
    const {token } = req.params;

    if(!token){
        throw new Error ('Verification token is required');
    }

    const verifyKey = `verify-email:${token}`;

    const userDataJSON = await redisClient.get(verifyKey);
    if(!userDataJSON){
        throw new Error('Invalid or expired verification token');
    }

    await redisClient.del(verifyKey);

    const userData = JSON.parse(userDataJSON);

    const existingUser = await User.findOne({email:userData.email});
    if(existingUser){
        throw new Error('User already exists');
    }
    
    // Fix: Remove 'new' keyword - User.create() is a static method
    const newUser = await User.create({
        name:userData.name,
        email:userData.email,
        password:userData.password,
    })
    
    res.status(201).json({
        success:true,
        message:"Email verified successfully! Your account has been created.",
        user:{
            id: newUser._id,
            name: newUser.name,
            email: newUser.email
        }
    })
})


// Login
export const loginUser = tryCatch(async(req,res,next)=>{
     const sanitazeBody = sanitize(req.body);

    const validation = loginSchema.safeParse(sanitazeBody);
    if(!validation.success){
        return res.status(400).json({
            message:"Validation Error",
        })
    }



    const {email,password}= validation.data;

    const rateLimit = `login-rate-limit:${req.ip}:${email} `

    if(await redisClient.get(rateLimit)){
        throw new Error('Too many requests. Please try again later.');
    }

    const user = await User.findOne({email})
    if(!user){
        throw new Error('Invalid credentials');
    }
    const comparePassword = await bcrypt.compare(password,user.password);
    if(!comparePassword){
        throw new Error('Invalid credentials');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    const otpKey = `otp:${email}`;

    await redisClient.set(otpKey, JSON.stringify(otp),{EX:300});

    const subject = 'otp for verification';
    const html = getOtpHtml({email,otp});

    await sendMail({email,subject,html});

    await redisClient.set(rateLimit, "true", {EX:60})

    res.status(200).json({
        message:'OTP has been sent to your email. It will expire in 5 minutes.',
    })

})



//verify OTP 
export const verifyOtp = tryCatch(async(req,res,next)=>{
    const {email, otp} = req.body;
    if(!email || !otp){
        throw new Error('Email and OTP are required');
    }

    const otpKey = `otp:${email}`;

    const storedOtpString = await redisClient.get(otpKey);
    if(!storedOtpString){
        throw new Error('OTP has expired or is invalid');
    }
   const storedOtp = JSON.parse(storedOtpString);
   if(storedOtp !== otp){
    throw new Error('Invalid OTP');
   }

   await redisClient.del(otpKey);

   const user = await User.findOne({email});

   const tokenData = await generateToken(user._id,res);
    res.status(200).json({
        success:true,
        message:`welcome back, ${user.name}`,
        ...tokenData
    });
})

export const myProfile = tryCatch(async(req,res,next)=>{
    const user = req.user;

    res.status(200).json({
        success: true,
        user: user
    });
});

export const refreshToken = tryCatch(async(req,res,next)=>{
    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        throw new Error('Refresh token not found, please login again');
    }

    const decode = await verifyRefreshToken(refreshToken);
    if(!decode){
        throw new Error('Invalid refresh token, please login again');
    }

    // Fix: Add await and get the new access token
    const newAccessToken = await generateAccessToken(decode.id, res);

    res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken
    });
})