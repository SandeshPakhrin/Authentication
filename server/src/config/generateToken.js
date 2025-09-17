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

    const refreshTokenKey = `refresh-token:${refreshToken}`;

    await redisClient.setEx(refreshTokenKey, 7 * 24 * 60 * 60, refreshToken);

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
};