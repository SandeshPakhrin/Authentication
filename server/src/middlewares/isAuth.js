
import jwt from "jsonwebtoken";
import { redisClient } from "../../index.js";
import { User } from "../model/user.js";

export const isAuth = async(req,res,next)=>{
    try {
        const token = req.cookies.accessToken;
        if(!token){
            throw new Error('Not authorized, no token');
        }
        const decodedData = jwt.verify(token, process.env.JWT_SECRETKEY);

        if(!decodedData){
            throw new Error('Not authorized, token failed');
        }

        const cachedUser = await redisClient.get(`user:${decodedData.id}`);
        if(cachedUser){
            req.user = JSON.parse(cachedUser);
            return next();
        }
        
        const user = await User.findById(decodedData.id).select('-password -__v');
        if(!user){
            throw new Error('No user found with this token');
        }
        
        // Fix: Added missing quotes around the key and fixed syntax
        await redisClient.setEx(`user:${user._id}`, 3600, JSON.stringify(user));
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message,
        });
    }
}
