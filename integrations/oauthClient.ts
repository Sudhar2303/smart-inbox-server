import { google } from "googleapis"

export const createOAuthClient = (refreshToken: string) => {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL
    )
    oauth2Client.setCredentials({ refresh_token: refreshToken })
    return oauth2Client;
};