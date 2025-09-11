import jwt from "jsonwebtoken";
import { Response } from "express";

export const generateToken = (userId: string): string => {
  if (!process.env.ACCESS_TOKEN) {
    throw new Error("ACCESS_TOKEN secret is not defined in environment variables")
  }

  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN, {
    expiresIn: "30d",
  })
}

export const setTokenCookie = ( response: Response, cookieName: string, token: string ): void => {
  response.cookie(cookieName, token, {
    httpOnly: true,
    secure: true, 
    sameSite: "none"
  })
}

export const clearTokenCookie = (response: Response, cookieName: string) => {
    response.clearCookie(cookieName,{
        httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
    })
}

export const parseCookies = (cookieString: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  cookieString.split(";").forEach(cookie => {
    const [key, value] = cookie.split("=").map(item => item?.trim());
    if (key) {
      cookies[key] = decodeURIComponent(value || "");
    }
  });
  return cookies;
};
