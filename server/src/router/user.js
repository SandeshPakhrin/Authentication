import { Router } from "express";
import { loginUser, myProfile, registerUser, verifyOtp, verifyUser } from "../controller/user.js";
import { isAuth } from "../middlewares/isAuth.js";


const userRouter = Router();

userRouter.route('/').post(registerUser);
userRouter.route('/verify/:token').post(verifyUser)
userRouter.route('/login').post(loginUser)
userRouter.route('/otp-verify').post(verifyOtp)
userRouter.route('/me').get(isAuth,myProfile)

export default userRouter;
