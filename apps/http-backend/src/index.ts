import express from "express";
import dotenv from "dotenv";
import path from "path";
// import {JWT_SECRET} from "@repo/backend-common/env";

dotenv.config();
const app = express();
// Specify the path to the root .env file
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const envPath = path.resolve(__dirname, "../../../.env");
console.log(envPath)

app.listen(3001,()=>{
    console.log("Http backend is running on 3000")
})

console.log(process.env.JWT_SECRET)
