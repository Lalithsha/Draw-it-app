import { Response,Request, Router } from "express";
import {z} from "zod";
import { authMiddleware } from "../middleware/authMiddleware";
const userRouter: Router = Router();

userRouter.get("/signup",(req:Request,res:Response)=>{

    const requireBody = z.object({
        username: z.string().min(3,{message:"Username must be greater than 3 characters"}).max(20,{message:"Username must be less than 20 characters"}),
        password: z.string().min(6,{message:"Password must be greater than 3 characters"}).max(20,{message:"Password cannot be greater than 20 characters"}),
        firstName: z.string().min(3).max(14),
        lastName: z.string().min(3).max(40)
    })
    
    const parsedDataWithSuccess = requireBody.safeParse(req.body);
    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: parsedDataWithSuccess.error
        })
        return;
    }
    const {username, password, firstName, lastName} = parsedDataWithSuccess.data;

    try{

        res.json({
            message:"User created successfully"
        })
        
    } catch(error){
         res.status(411).json({
            message:`Email already taken / Incorrect inputs ${error}`
        })
        return;
    }
    
    
})

userRouter.get("/signin",(req,res)=>{
    const requiredBody = z.object({
        username : z.string().min(3).max(20),
        password : z.string().min(3).max(20)
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

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

