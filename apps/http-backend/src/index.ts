import express from "express";
import dotenv from "dotenv";
import path from "path";
import { mainRouter } from "./routes";
// import {JWT_SECRET} from "@repo/backend-common/env";

dotenv.config();
const app = express();
app.use(express.json());

// Specify the path to the root .env file
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const envPath = path.resolve(__dirname, "../../../.env");
console.log(envPath)

app.use("/api/v1",mainRouter);
app.listen(3001,()=>{
    console.log("Http backend is running on 3001")
})

console.log(process.env.JWT_SECRET)
