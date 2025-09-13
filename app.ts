import express, { Application, Request, Response, NextFunction } from "express"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import passport from "./configurations/passportConfig";

dotenv.config();

import authRoutes from './routes/authRoute'
import googleaAuthRoutes from './routes/googleAuthRoute'
import gmailRoutes from './routes/emailRoute'
import draftRoutes from './routes/draftRoute'
import userRoute from './routes/userRoute'
import calendarRoute from './routes/calendarRoute'

const app: Application = express()
app.use(passport.initialize())
app.use(cors({
    origin: process.env.CORS_ORIGIN_URL, 
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get("/", (request: Request, response: Response) => {
  response.send("Custom Email Workflow Tool Backend is running!")
});

app.use((error: Error, request: Request, response: Response, next: NextFunction) => {
  console.error("Error:", error.message)
  response.status(500).json({ message: "Something went wrong!", error: error.message })
});

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/auth/google', googleaAuthRoutes)
app.use('/api/v1/gmail/emails', gmailRoutes) 
app.use('/api/v1/gmail/draft', draftRoutes) 
app.use('/api/v1/user',userRoute)
app.use('/api/v1/calendar',calendarRoute)

export default app


