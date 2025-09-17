import { Router } from "express";
import { registerUser, verifyUser } from "../controller/user.js";

const userRouter = Router();

userRouter.route('/').post(registerUser);
userRouter.route('/verify/:token').post(verifyUser)

export default userRouter;
