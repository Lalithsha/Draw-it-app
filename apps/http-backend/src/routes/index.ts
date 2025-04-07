import { Router } from "express";
import {userRouter} from "./user"
const mainRouter:Router = Router();

mainRouter.use("/user",userRouter)

export {mainRouter};
