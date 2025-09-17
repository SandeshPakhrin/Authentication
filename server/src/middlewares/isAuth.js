
import jwt from "jsonwebtoken";
import { redisClient } from "../../index.js";
import { User } from "../model/user";
import { success } from "zod";
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

        const cashedUser = await redisClient.get(`user:${decodedData.id}`)
        if(cashedUser){
            req.user= JSON.parse(cashedUser);
            return next()
        }
        const user = await User.findById(decodedData.id).select('-password -__v');
        if(!user){
            throw new Error('No user found with this token');
        }
        await redisClient.setEx(`user:${user._id},3600, JSON.stringify(user)`);
        req.user = user;
        next();
    } catch (error) {
        res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}
