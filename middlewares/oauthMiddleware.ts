import { Request, Response, NextFunction } from "express"
import passport from "passport"
import jwt from "jsonwebtoken"
import axios from "axios"
import { setResponseBody } from "../utils/responseFormatter"
import { findUserById } from "../services/authService"
import { findOAuthTokenById } from "../services/oauthTokenservice"
import { verifyGoogleAccessToken } from "../utils/googleTokenService" 
import { parseCookies } from '../utils/tokenService'

export const authenticateWithGoogle = ( request: Request, response: Response, next: NextFunction ): void => {
    const authOptions = {
        scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/calendar"
        ],
        accessType: "offline",
        session: false, 
    }
    passport.authenticate("google", authOptions)(request, response, next)
}


export const verifyGoogleUser = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const authHeader = request.headers["cookie"]
    if (!authHeader) {
        return response.status(401).send(setResponseBody("Token not found", "authentication_error"))
    }

    const cookies = parseCookies(authHeader)
    const googleAuthToken = cookies.googleAuthToken

    if (!googleAuthToken) {
        return response.status(401).send(setResponseBody("GoogleAuth token not found", "authentication_error"))
    }

    jwt.verify(googleAuthToken, process.env.ACCESS_TOKEN as string, async (error, decoded: any) => {
      if (error) {
        return response
          .status(401)
          .send(setResponseBody("Google token expired or invalid", "authentication_error"))
      }

      const { _id, accessToken } = decoded
      try {
        const user = await findUserById(_id)
        const existingOauthUser = await findOAuthTokenById(_id, "google")

        if (!user || !existingOauthUser) {
          return response.status(401).send(setResponseBody("Unauthorized User", "authentication_error"))
        }

        let newAccessToken = await verifyGoogleAccessToken( accessToken, existingOauthUser.refreshToken, _id, response, request)

        if (!newAccessToken) {
          return
        }

        (request as any).user = {
          _id,
          email: user.email,
        };
        (request as any).isAuthenticated = true

        return next()
      } catch (err) {
        console.error("Google authentication error:", err)
        if (!response.headersSent) {
            return response.status(500).send(setResponseBody("Internal server error", "server_error"))
        }
      }
    })
  } catch (error: any) {
    response.status(500).send(setResponseBody(error.message, "server_error"))
  }
}
