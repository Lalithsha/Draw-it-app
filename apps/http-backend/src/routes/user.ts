import { Response,Request, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { CreateUserSchema, SigninSchema } from "@repo/common/types";
import { z } from "zod";
import {prismaClient} from "@repo/db/client"
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { randomBytes, createHash, timingSafeEqual } from "crypto";

const userRouter: Router = Router();
const app = express();
app.use(express.json());

// Simple in-memory rate limit for POST /shapes (per IP)
const SHAPE_RATE_WINDOW_MS = 1000;
const SHAPE_MAX_PER_WINDOW = 30;
const shapeRate: Map<string, { windowStart: number; count: number }> = new Map();

function signAccessToken(userId: number | string) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }
    return jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, {
        expiresIn: "15m",
    });
}

// Guest access token, scoped to a room id (type: "access", id: guest:<gid>, roomId)
function signGuestAccessToken(guestId: string, roomId: string) {
  const secret = process.env.JWT_SECRET as string;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ id: `guest:${guestId}`, type: "access", roomId }, secret, { expiresIn: "30m" });
}

function hashPasscode(passcode: string) {
  return createHash("sha256").update(passcode).digest("hex");
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



// Create a new room with the authenticated user as admin (used for collab sessions)
userRouter.post("/room", authMiddleware, async (req:Request,res:Response)=>{
    try{
        const userId = req.userId;
        const room = await prismaClient.room.create({ data:{ adminId: userId } })
        res.json({ roomId: room.id })
        return;
    } catch(error){
        res.status(500).json({
            message:`Failed to create room`
        })
    }
})

// Guest creates ephemeral room (no auth) – creates a system-owned ephemeral room
userRouter.post("/room/guest", async (_req:Request,res:Response)=>{
    try{
        // Option A: create under a synthetic admin (system) to keep adminId relation valid
        // Retrieve or lazily create a special system user
        let system = await prismaClient.user.findFirst({ where: { email: "system@guest" } });
        if (!system) {
            system = await prismaClient.user.create({ data: { email: "system@guest", name: "System", password: "x" } });
        }
        const room = await prismaClient.room.create({ data: { adminId: system.id } });
        res.json({ roomId: room.id })
    } catch (error){
        res.status(500).json({ message:`Failed to create guest room` })
    }
})

// Create a signed share link (auth only), optional passcode, optional expiry
userRouter.post("/share", authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma: any = prismaClient;
    const { roomId, expiresInMinutes, passcode } = req.body as { roomId?: string; expiresInMinutes?: number; passcode?: string };
    if (!roomId) {
      res.status(400).json({ message: "roomId required" }); return;
    }
    const room = await prismaClient.room.findUnique({ where: { id: roomId } });
    if (!room || room.adminId !== req.userId) { res.status(403).json({ message: "not allowed" }); return; }
    const token = randomBytes(16).toString("hex");
    const expiresAt = expiresInMinutes ? new Date(Date.now() + expiresInMinutes * 60 * 1000) : null;
    const passcodeHash = passcode ? hashPasscode(passcode) : null;
    await prisma.shareLink.create({ data: { roomId, token, expiresAt: expiresAt ?? undefined, passcodeHash: passcodeHash ?? undefined } });
    res.json({ token, expiresAt });
  } catch (e) {
    res.status(500).json({ message: "failed to create share link" });
  }
});

// Revoke a share link
userRouter.post("/share/revoke", authMiddleware, async (req: Request, res: Response) => {
  try {
    const prisma: any = prismaClient;
    const { token } = req.body as { token?: string };
    if (!token) { res.status(400).json({ message: "token required" }); return; }
    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link) { res.status(404).json({ message: "not found" }); return; }
    const room = await prismaClient.room.findUnique({ where: { id: link.roomId } });
    if (!room || room.adminId !== req.userId) { res.status(403).json({ message: "not allowed" }); return; }
    await prisma.shareLink.update({ where: { token }, data: { revokedAt: new Date() } });
    res.json({ message: "revoked" });
  } catch {
    res.status(500).json({ message: "failed to revoke" });
  }
});

// Guest bridge: validate share link and issue room-scoped guest access token
userRouter.post("/guest/bridge", async (req: Request, res: Response) => {
  try {
    const prisma: any = prismaClient;
    const { token, passcode } = req.body as { token?: string; passcode?: string };
    if (!token) { res.status(400).json({ message: "token required" }); return; }
    const link = await prisma.shareLink.findUnique({ where: { token } });
    if (!link || link.revokedAt) { res.status(403).json({ message: "invalid link" }); return; }
    if (link.expiresAt && link.expiresAt < new Date()) { res.status(403).json({ message: "expired" }); return; }
    if (link.passcodeHash) {
      if (!passcode) { res.status(401).json({ message: "passcode required" }); return; }
      const provided = hashPasscode(passcode);
      if (provided !== link.passcodeHash) { res.status(401).json({ message: "invalid passcode" }); return; }
    }
    const guestId = randomBytes(8).toString("hex");
    const accessToken = signGuestAccessToken(guestId, link.roomId);
    res.json({ token: accessToken, roomId: link.roomId });
  } catch {
    res.status(500).json({ message: "failed guest bridge" });
  }
});

// Ensure a solo room for the current admin (returns the latest or creates one)
userRouter.get("/room/solo", authMiddleware, async (req:Request,res:Response)=>{
    try{
        const userId = req.userId;
        let room = await prismaClient.room.findFirst({
            where: { adminId: userId },
            orderBy: { createdAt: "desc" }
        });
        if(!room){
            room = await prismaClient.room.create({ data: { adminId: userId } });
        }
        res.json({ room });
    } catch (error){
        res.status(500).json({ message: "Failed to ensure solo room" })
    }
})

// Fetch shapes for a room (solo or collab)
userRouter.get("/shapes/:roomId", async (req,res)=>{
    const roomId  = String(req.params.roomId);
    try{
        const shapes = await prismaClient.shape.findMany({
            where:{ roomId },
            orderBy:{ createdAt: "desc" },
            take:200
        })
        res.json({ shapes })
    } catch(err){
        res.status(400).json({ message:"Failed to get shapes" })
    }
})

// Create shape (used for solo saving without websockets)
userRouter.post("/shapes", authMiddleware, async (req:Request, res:Response) => {
    try {
    // basic IP rate limiting
    const key = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
    const now = Date.now();
    const entry = shapeRate.get(key) || { windowStart: now, count: 0 };
    if (now - entry.windowStart > SHAPE_RATE_WINDOW_MS) { entry.windowStart = now; entry.count = 0; }
    entry.count++;
    shapeRate.set(key, entry);
    if (entry.count > SHAPE_MAX_PER_WINDOW) { res.status(429).json({ message: "rate limit" }); return; }

    const { roomId, message } = req.body as { roomId?: string; message?: string };
        const userId = req.userId;
        if (!roomId || typeof roomId !== 'string' || !message || typeof message !== 'string') {
            res.status(400).json({ message: "Invalid roomId or message" });
            return;
        }
    // validate shape payload structure (loose pass-through for now)
    try {
      const ShapePayloadSchema = z.object({ shape: z.object({}).passthrough() });
      ShapePayloadSchema.parse(JSON.parse(message));
    } catch {
      res.status(400).json({ message: "Invalid shape payload" });
      return;
    }
        const shape = await prismaClient.shape.create({
            data: {
                roomId,
                message,
                userId,
            }
        });
        res.json({ message: "saved", shape });
    } catch (err) {
        res.status(500).json({ message: "Failed to save shape" });
    }
});

// Deprecated slug lookup removed with new schema (use /room/solo or store ids client-side)


export {userRouter}

