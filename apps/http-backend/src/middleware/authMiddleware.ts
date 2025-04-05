import  { Response,Request, NextFunction } from "express";
import { JwtPayload, sign, verify } from "jsonwebtoken";


declare global {
    namespace Express{
        export interface Request{
            userId:string;
        }
    }
}

export function authMiddleware(req:Request, res:Response, next:NextFunction){


    const token = req.headers["Authorization"] ?? ""; 
    // var token = authHeader && authHeader.split(' ')[1]
    console.log("JWT secrect ", process.env.JWT_SECRET);
    // @ts-ignore
    const decoded = verify(token,process.env.JWT_SECRET) 
    if(!decoded){
        res.json({
            message:"Unauthorized"
        })
        return;
    } else {
        // @ts-ignore
        req.userId = decoded.userId;
        next();
    }
    
    
}







