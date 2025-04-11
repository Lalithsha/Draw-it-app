import { Response,Request, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client"
import express from "express";
import bcrypt from "bcryptjs";
import { Jwt, sign } from "jsonwebtoken";
import jwt from "jsonwebtoken";

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
    const hashedPassword = await bcrypt.hash(password,4);
    try{
        // Hash the password
        const user = await prismaClient.user.create({
           data:{
            name,
            email: username, 
            password:hashedPassword
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
            message:`User already exits with this email  / Incorrect inputs ${error}`
        })
        return;
    }
    
    
})

userRouter.post("/signin", async (req,res)=>{
    const parsedDataWithSuccess = SigninSchema.safeParse(req.body);

    if(!parsedDataWithSuccess.success){
        res.status(400).json({
            message: parsedDataWithSuccess.error
        })
        return;
    }

    const {username, password} = parsedDataWithSuccess.data;
    
    console.log(username+" ", password)
    try{
        const user = await prismaClient.user.findFirst({
            where:{
                email:username
            }
        })
        console.log("User is: ",  user);
        if(!user){
            res.status(403).json({
                message:"User does not exists"
            })
            return;
        }
        // @ts-ignore
        const passwordMatch = await bcrypt.compare(password,user?.password);
        
        if(!passwordMatch){
            res.status(401).json({
                message:"Incorrect password"
            })
            return;
        }

        console.log("From sign in: ",  process.env.JWT_SECRET)
        // @ts-ignore
        const token =  jwt.sign(user.id, process.env.JWT_SECRET);

        res.json({
            message:"sign in successfully",
            token
        })
        
    } catch(error){
        res.status(403).json({
            message:"Invalid credentials"
        })
    }
    
    
    
})



userRouter.post("/room", authMiddleware, async (req:Request,res:Response)=>{

    const parsedData = CreateRoomSchema.safeParse(req.body);

    if(!parsedData.success){
        res.json({
            message:"Incorrect inputs"
        })
        return;
    }
    const {name} = parsedData.data;
    const userId = req.userId;
    console.log("User id from room" , userId)
    try{
        const room = await prismaClient.room.create({
            data:{
                slug:name,
                adminId:userId
            }
        })
        res.json({
            roomId:room.id
        })
        return;
    } catch(error){
        res.status(411).json({
            message:`Room already exists with this name , ${error}`
        })
    }
})

userRouter.get("/chats/:roomId", async (req,res)=>{
    const roomId  = Number(req.body.roomId);
    try{
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId
            },
            orderBy:{
                id:"desc"
            },
            take:50
        })
        
        res.json({
            messages
        })
    } catch(err){
        res.status(400).json({
            message:"Failed to get chats"
        })
    }
})

export {userRouter}

