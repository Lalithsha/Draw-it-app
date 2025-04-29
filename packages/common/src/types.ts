import {z} from "zod";

export const CreateUserSchema = z.object({
    username: z.string().min(3,{message:"Username must be greater than 3 characters"}).max(50,{message:"Username must be less than 50 characters"}),
    password: z.string().min(6,{message:"Password must be greater than 3 characters"}).max(20,{message:"Password cannot be greater than 20 characters"}),
    name: z.string().min(3).max(20)
})
export const SigninSchema = z.object({
    username: z.string().min(3,{message:"Username must be greater than 3 characters"}).max(20,{message:"Username must be less than 20 characters"}),
    password: z.string().min(3).min(6,{message:"Password must be greater than 3 characters"}).max(20,{message:"Password cannot be greater than 20 characters"}),
})
export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20) 
})







