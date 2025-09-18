import jwt from "jsonwebtoken";
import { redisClient } from "../../index.js";
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = async (id, res) => {
    const accessToken = jwt.sign({id}, process.env.JWT_SECRETKEY, {
        expiresIn: '15m',
    });

    const refreshToken = jwt.sign({id}, process.env.REFRESH_SECRETKEY, {
        expiresIn: '7d',
    });

    // Fix: Store refresh token using user ID as key
    const refreshTokenKey = `refresh-token:${id}`;

    await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
};


export const verifyRefreshToken = async(refreshToken)=>{
    try {
        const decode = jwt.verify(refreshToken, process.env.REFRESH_SECRETKEY);
        // Fix: Use user ID to get stored token
        const storedToken = await redisClient.get(`refresh-token:${decode.id}`);
        
        if(storedToken === refreshToken){
            return decode;
        }
        return null;

    } catch (error) {
        return null
    }
}

export const generateAccessToken = async(id,res)=>{
    const accessToken = jwt.sign({id}, process.env.JWT_SECRETKEY, {
        expiresIn: '15m',
    });

    res.cookie('accessToken', accessToken,{
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite:'strict',
        maxAge: 1 * 60 * 1000,
    });

    return accessToken;
}

export const removeRefreshToken = async(userId)=>{
    await redisClient.del(`refresh-token:${userId}`);

}