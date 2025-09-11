import axios from "axios"
import jwt from "jsonwebtoken"
import { Response, Request } from "express"
import { Types } from "mongoose"
import { setTokenCookie, clearTokenCookie } from "../utils/tokenService"
import { setResponseBody } from "../utils/responseFormatter"
import { updateOAuthToken } from "../services/oauthTokenservice"

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
    try {
        const response = await axios.post("https://oauth2.googleapis.com/token", null, {
        params: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        },
        })

        return response.data.access_token
    } 
    catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
        const { status, data } = error.response

        if (status === 400 && data.error === "invalid_grant") {
            throw new Error(
            "Session Expired: Your refresh token is invalid or has expired. Please log in again."
            )
        }

        if (status === 429) {
            throw new Error(
            "Too Many Requests: You have exceeded the request limit. Please try again later."
            )
        }

        throw new Error(
            `OAuth Error: ${data.error_description || "Failed to refresh access token."}`
        )
        }

        throw new Error(
        "Network Error: Unable to connect to Google's OAuth server. Please check your connection."
        )
    }
}

export const verifyGoogleAccessToken = async (
  accessToken: string,
  refreshToken: string | undefined,
  userId: string,
  response: Response,
  request: Request
): Promise<string | null> => {
  try {
    
    const googleResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    (request as any).user = {
      _id: userId,
      email: googleResponse.data.email,
    };

    return accessToken
  } catch (error: any) {

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        if (!refreshToken) {
          response.status(440).send(setResponseBody("Session Expired", "session_expired"))
          return null
        }

        const newAccessToken = await refreshAccessToken(refreshToken)

        clearTokenCookie(response, "googleAuthToken")
        const token = jwt.sign(
          { _id: userId, accessToken: newAccessToken },
          process.env.ACCESS_TOKEN as string,
          { expiresIn: "30d" }
        )
        setTokenCookie(response, "googleAuthToken", token)

        return await verifyGoogleAccessToken(newAccessToken, refreshToken, userId, response, request)
      } catch (refreshError: any) {
        await updateOAuthToken({
          _id: new Types.ObjectId(userId),
          provider: "google",
          providerId: "google-oauth", 
          refreshToken: undefined,
        })

        response.status(440).send(setResponseBody("Session Expired", "session_expired"))
        return null
      }
    }

    response.status(401).send(setResponseBody("Invalid Google Token", "authentication_error"))
    return null
  }
}
