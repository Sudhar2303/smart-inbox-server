import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import { setTokenCookie } from "../utils/tokenService"
import { setResponseBody } from "../utils/responseFormatter"
import { findOAuthTokenById, updateOAuthToken } from "../services/oauthTokenservice"
import { findUserByEmail, createUser, findUserById } from "../services/authService"
import { Types } from "mongoose"

interface GoogleProfile {
  id: string
  displayName: string
  emails: { value: string }[]
}

interface GoogleAuthUser {
  profile: GoogleProfile
  accessToken: string
  refreshToken: string
}

export const googleAuthCallback = async (request: Request, response: Response): Promise<void> => {
    try 
    {
        const { profile, accessToken, refreshToken } = request.user as GoogleAuthUser
        
        const userData = {
            name: profile.displayName,
            email: profile.emails[0].value,
        }

        let existingUser = await findUserByEmail(userData.email)
        let newUser

        if (!existingUser) {
            newUser = await createUser(userData.name, userData.email)
        }

        const finalUser = newUser || existingUser
        if (!finalUser?._id) {
            throw new Error("User creation or retrieval failed")
        }

        const existingOauthUser = await findOAuthTokenById(finalUser._id, "google")

        if (!existingOauthUser || !existingOauthUser.refreshToken) {
            await updateOAuthToken({
            _id: finalUser._id,
            provider: "google",
            providerId: profile.id,
            refreshToken: refreshToken,
            })
        }

        const token = jwt.sign(
            { _id: finalUser._id, accessToken },
            process.env.ACCESS_TOKEN as string,
            { expiresIn: "30d" }
        )

        setTokenCookie(response, "googleAuthToken", token)

        response.redirect(process.env.POST_AUTH_REDIRECT_URL as string)
    } 
    catch (error: any) {
        response.status(500).send(setResponseBody(error.message, "server_error"))
    }
}


export const getAuthenticationStatus = async (request: Request, response: Response) => {
  try {
    const userId = (request.user as { _id: Types.ObjectId })?._id;

    if (!userId) {
      return response.status(401).send(setResponseBody("User not authenticated", "unauthorized", { authenticated: false }));
    }

    const existingUser = await findUserById(userId);

    if (!existingUser) {
      return response.status(404).send(setResponseBody("User not found", "invalid_user", { authenticated: false }));
    }

    return response.status(200).send(setResponseBody("Valid user", "success", { authenticated: true }));
  } catch (error: any) {
    return response.status(500).send(setResponseBody(error.message || "Internal server error", "server_error", { authenticated: false }));
  }
};