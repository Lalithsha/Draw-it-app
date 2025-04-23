import  { Response,Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
    namespace Express{
        export interface Request{
            userId:string;
        }
    }
}

// old way to get the token from the header
// export function authMiddleware(req:Request, res:Response, next:NextFunction){

//     const token = req.headers["authorization"] ?? "" ; 
//     // var token = authHeader && authHeader.split(' ')[1]

//     console.log("JWT secrect ", process.env.JWT_SECRET);
//     console.log(token);

//     // @ts-ignore
//     const decoded = jwt.verify(token,process.env.JWT_SECRET) 
//     console.log(decoded);
//     if(!decoded){
//         res.status(403).json({
//             message:"Unauthorized"
//         })
//         return;
//     } else {
//         // @ts-ignore
//         console.log("From auth middleware  ",  decoded.id);
//         // @ts-ignore
//         req.userId = decoded;
//         next();
//     }
    
    
// }


export function authMiddleware(req:Request, res:Response, next:NextFunction){
    const token = req.cookies.access_token;
    console.log("JWT secrect ", process.env.JWT_SECRET);
    console.log(token);

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
        req.userId = decoded;
        next();
    }
}







