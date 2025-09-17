import { Router } from "express";
import { loginUser, registerUser, verifyOtp, verifyUser } from "../controller/user.js";


const userRouter = Router();

userRouter.route('/').post(registerUser);
userRouter.route('/verify/:token').post(verifyUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/otp-verify').post(verifyOtp)
export default userRouter;
