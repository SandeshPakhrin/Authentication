import { Router } from "express";
import { loginUser, registerUser, verifyUser } from "../controller/user.js";

const userRouter = Router();

userRouter.route('/').post(registerUser);
userRouter.route('/verify/:token').post(verifyUser)
userRouter.route('/login').post(loginUser)
export default userRouter;
