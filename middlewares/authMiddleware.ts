import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { setResponseBody } from "../utils/responseFormatter"
import { findUserById } from "../services/authService"
import { parseCookies } from '../utils/tokenService'

export const verifySessionUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const authHeader = request.headers["cookie"]
        if (!authHeader) {
            return response.status(401).send(setResponseBody("Token not found", "authentication_error"))
        }

        const cookies = parseCookies(authHeader)
        const sessionId = cookies["SessionID"]

        if (!sessionId) {
            return response.status(401).send(setResponseBody("SessionID not found", "authentication_error"))
        }

        jwt.verify(sessionId, process.env.ACCESS_TOKEN as string, async (error, decoded: any) => {
            if (error || !decoded) {
                return response.status(401).send(setResponseBody("Session expired", "authentication_error"))
            }

            const { id } = decoded
            const user = await findUserById(id)

            if (!user) {
                return response.status(401).send(setResponseBody("Unauthorized User", "authentication_error"))
            }

            (request as any).user = {
                _id: user._id,
                email: user.email,
            };
            (request as any).isAuthenticated = true

            return next()
        })
    } catch (error: any) {
        return response.status(500).send(setResponseBody(error.message, "server_error"))
    }
}
