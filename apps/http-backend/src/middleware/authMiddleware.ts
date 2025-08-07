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
    const token = req.cookies.access_token;
    if (!token) {
        res.status(401).json({ message: "No token, please login" });
        return;
    }
    console.log("JWT secrect ", process.env.JWT_SECRET);
    console.log(token);
    try {
    // @ts-ignore
    const decoded = jwt.verify(token,process.env.JWT_SECRET) 
    console.log(decoded);
    if(!decoded){
        res.status(403).json({
            message:"Unauthorized"
        })
        return;
    } else {
        // @ts-ignore    
        console.log("From auth middleware  ",  decoded.id);
        // @ts-ignore
        req.userId = decoded.id;
        next();
    }
    } catch (err) {
         res.status(403).json({ message: "Invalid/expired token, please re-authenticate" });
         return;
    }
}







