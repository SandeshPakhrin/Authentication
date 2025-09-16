import { Router } from "express";
import { registerUser } from "../controller/user.js";

const userRouter = Router();

userRouter.route('/').post(registerUser);

export default userRouter;
