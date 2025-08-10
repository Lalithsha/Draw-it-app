import { Response,Request, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {CreateRoomSchema, CreateUserSchema, SigninSchema} from "@repo/common/types";
import {prismaClient} from "@repo/db/client"
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userRouter: Router = Router();
const app = express();
app.use(express.json());

function signAccessToken(userId: number | string) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    return jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });
}

function signRefreshToken(userId: number | string) {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!refreshSecret) {
        throw new Error("JWT_REFRESH_SECRET/JWT_SECRET is not configured");
    }
    return jwt.sign({ id: userId, type: "refresh" }, refreshSecret, {
        expiresIn: "7d",
    });
}

function hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

userRouter.post("/signup", async(req:Request,res:Response)=>{
    const parsedDataWithSuccess = CreateUserSchema.safeParse(req.body);
    if(!parsedDataWithSuccess.success){
        console.log("The error is : ", parsedDataWithSuccess.error)
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
        console.log("The error is unauthorized : ", parsedDataWithSuccess.error)
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

        // Old approach to sign-in
        // console.log("From sign in: ",  process.env.JWT_SECRET)
        // // @ts-ignore
        // const token =  jwt.sign(user.id, process.env.JWT_SECRET);

        // res.json({
        //     message:"sign in successfully",
        //     token
        // })

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        // Persist refresh token hash for rotation/revocation
        const hashed = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prismaClient.refreshToken.create({
            data: {
                userId: user.id,
                hashedToken: hashed,
                expiresAt,
                userAgent: (req.headers["user-agent"] as string) || null,
                ip: (req.ip as string) || null,
            }
        });

        res
          .cookie("access_token", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production'
          })
          .cookie("refresh_token", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
            path: "/"
          })
          .json({
            message: "sign-in successfully",
            token: accessToken,
            user: { id: user.id, email: user.email, name: user.name }
          })
        return;
        
    } catch(error){
        res.status(403).json({
            message:"Invalid credentials"
        })
    }
    
    
    
})

// Refresh access token using refresh token cookie/header/body
userRouter.post("/refresh", async (req:Request, res:Response) => {
    try {
        const cookieToken = req.cookies?.refresh_token as string | undefined;
        const header = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
        const headerToken = header && header.startsWith("Bearer ") ? header.substring("Bearer ".length) : undefined;
        const bodyToken = (req.body && (req.body.refreshToken || req.body.refresh_token)) as string | undefined;

        const refreshToken = cookieToken || headerToken || bodyToken;
        if (!refreshToken) {
            res.status(401).json({ message: "No refresh token" });
            return;
        }

        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
        if (!refreshSecret) {
            res.status(500).json({ message: "Server misconfigured" });
            return;
        }

        const decoded = jwt.verify(refreshToken, refreshSecret) as { id: number | string; type?: string };
        if (!decoded || decoded.type !== "refresh") {
            res.status(403).json({ message: "Invalid refresh token" });
            return;
        }

        // Validate token against DB and rotate
        const providedHash = hashToken(refreshToken);
        const existing = await prismaClient.refreshToken.findUnique({
            where: { hashedToken: providedHash }
        });
        if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
            res.status(403).json({ message: "Invalid/expired refresh token" });
            return;
        }

        const newAccessToken = signAccessToken(decoded.id);
        const newRefreshToken = signRefreshToken(decoded.id);
        const newHash = hashToken(newRefreshToken);
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prismaClient.refreshToken.update({
            where: { id: existing.id },
            data: { hashedToken: newHash, expiresAt: newExpiresAt, revokedAt: null }
        });

        res
          .cookie("access_token", newAccessToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production'
          })
          .cookie("refresh_token", newRefreshToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
            path: "/"
          })
          .json({ message: "token refreshed", token: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: "Invalid/expired refresh token" });
    }
});

// Logout and clear cookies
userRouter.post("/logout", async (_req:Request, res:Response) => {
    // Revoke current refresh token if present
    const rt = _req.cookies?.refresh_token as string | undefined;
    if (rt) {
        const hashed = hashToken(rt);
        await prismaClient.refreshToken.deleteMany({ where: { hashedToken: hashed } });
    }
    res
      .clearCookie("access_token", { path: "/" })
      .clearCookie("refresh_token", { path: "/" })
      .json({ message: "logged out" });
});


// OAuth bridge: create/find user by email and issue cookies
userRouter.post("/oauth/bridge", async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body as { email?: string; name?: string };
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        // Find or create user
        let user = await prismaClient.user.findFirst({ where: { email } });
        if (!user) {
            const randomPassword = crypto.randomBytes(16).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 4);
            user = await prismaClient.user.create({
                data: {
                    email,
                    name: (name ?? email.split("@")[0]) as string,
                    password: hashedPassword,
                }
            });
        }

        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        const hashed = hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prismaClient.refreshToken.create({
            data: {
                userId: user.id,
                hashedToken: hashed,
                expiresAt,
                userAgent: (req.headers["user-agent"] as string) || null,
                ip: (req.ip as string) || null,
            }
        });

        res
          .cookie("access_token", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production'
          })
          .cookie("refresh_token", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
            path: "/"
          })
          .json({ message: "oauth bridged", user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
        res.status(500).json({ message: "Failed to bridge oauth" });
    }
});



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
    const roomId  = Number(req.params.roomId);
    try{
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId
            },
            orderBy:{
                id:"desc"
            },
            take:200
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

// Create chat (used for solo/draft saving without websockets)
userRouter.post("/chats", authMiddleware, async (req:Request, res:Response) => {
    try {
        const { roomId, message } = req.body as { roomId?: number | string; message?: string };
        console.log("Room id is: ", roomId)
        console.log("Message is: ", message)
        const userId = req.userId;
        const numericRoomId = Number(roomId);
        if (!Number.isFinite(numericRoomId) || !message || typeof message !== 'string') {
            res.status(400).json({ message: "Invalid roomId or message" });
            return;
        }
        const chat = await prismaClient.chat.create({
            data: {
                roomId: numericRoomId,
                message,
                userId: userId,
            }
        });
        res.json({ message: "saved", chat });
    } catch (err) {
        res.status(500).json({ message: "Failed to save chat" });
    }
});


userRouter.get("/room/:slug", async(req,res)=>{

    const slug = req.params.slug;
    try{
        const room  =  await prismaClient.room.findFirst({ 
            where:{
                slug
            }
        })
        console.log("Room is: ", room)
        res.json({
            message:"Successfully found room",
            room
        })
    } catch(err){
        res.status(404).json({
            message:"Room not found"
        })
    }  
    
})


export {userRouter}

