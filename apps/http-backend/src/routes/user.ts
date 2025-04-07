import { Response,Request, Router } from "express";
import {z} from "zod";
import { authMiddleware } from "../middleware/authMiddleware";
import {CreateUserSchema,SigninSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client"
import express from "express";
const userRouter: Router = Router();
const app = express();
app.use(express.json());

userRouter.post("/signup", async(req:Request,res:Response)=>{
    const parsedDataWithSuccess = CreateUserSchema.safeParse(req.body);
    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: parsedDataWithSuccess.error,
            mess:"Incorrect inputs"
        })
        return;
    }
    const {username, password, name} = parsedDataWithSuccess.data;

    try{
        // Hash the password
        const user = await prismaClient.user.create({
           data:{
            name,
            email: username, 
            password
           }
        })
        console.log("The result of create is : ",  user)
        res.json({
            message:`User created successfully with id: ${user.id}`
        })
        return;
    } catch(error){
        //  res.status(411).json({
        //     message:`Email already taken / Incorrect inputs ${error}`
        // })
        res.status(411).json({
            // @ts-ignore
            message:`User already exits with this email  / Incorrect inputs ${error}`
        })
        return;
    }
    
    
})

userRouter.post("/signin",(req,res)=>{
    // const requiredBody = z.object({
    //     username : z.string().min(3).max(20),
    //     password : z.string().min(3).max(20)
    // })

    const parsedDataWithSuccess = SigninSchema.safeParse(req.body);

    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: parsedDataWithSuccess.error
        })
        return;
    }

    const {username, password} = parsedDataWithSuccess.data;

    try{

    } catch(error){
        res.status(403).json({
            message:"Invalid credentials"
        })
    }
    
    
    
})



userRouter.post("/room",authMiddleware, (req:Request,res:Response)=>{
    res.json({
        roomId:"1234"
    })
    return;
})

// module.exports = {userRouter}
export {userRouter}

