import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


// import routes here 

import userRouter from "./routes/user.routes.js";
import cuserRouter from "./routes/cuser.routes.js";
import ccallRouter from "./routes/ccall.routes.js";


// declear routes here

app.get("/", (req, res)=> {
    res.status(200).json("everything is working fine")
})

app.use("/api/v1/user", userRouter);
app.use("/api/v1/cuser", cuserRouter);
app.use("/api/v1/ccall", ccallRouter);


export { app }