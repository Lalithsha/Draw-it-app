import  { Response,Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express{
        export interface Request{
            userId:string;
        }
    }
}

export function authMiddleware(req:Request, res:Response, next:NextFunction){
    const cookieToken = req.cookies?.access_token as string | undefined;
    const header = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
    const headerToken = header && header.startsWith("Bearer ") ? header.substring("Bearer ".length) : undefined;
    const token = cookieToken || headerToken;
    if (!token) {
        res.status(401).json({ message: "No token, please login" });
        return;
    }
    console.log("JWT secrect ", process.env.JWT_SECRET);
    console.log(token);
    try {
    // @ts-ignore
    const decoded = jwt.verify(token,process.env.JWT_SECRET as string) as { id?: string; type?: string } 
    console.log(decoded);
    if(!decoded || decoded.type !== 'access'){
        res.status(403).json({
            message:"Unauthorized"
        })
        return;
    } else {
        console.log("From auth middleware  ",  decoded.id);
        req.userId = decoded.id as string;
        next();
    }
    } catch (err) {
         res.status(403).json({ message: "Invalid/expired token, please re-authenticate" });
         return;
    }
}







