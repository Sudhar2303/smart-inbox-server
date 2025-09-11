import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import { findUserByEmail, createUser } from "../services/authService"
import { generateToken, setTokenCookie, clearTokenCookie } from "../utils/tokenService"
import { setResponseBody } from "../utils/responseFormatter"

export const signup = async (request: Request, response: Response) => {
    try 
    {
        const { name, email, password } = request.body

        const existingUser = await findUserByEmail(email)
        if (existingUser) {
            return response.status(400).send(setResponseBody("User already exists", "user_exists", {}))
        }

        const user = await createUser(name, email, password)
        const token = generateToken(user._id.toString())
        setTokenCookie(response, "SessionID", token)

        response.status(201).send(setResponseBody("Signup successful", null, { id: user._id, name: user.name, email: user.email }))
    } 
    catch (error) {
        response.status(500).send(setResponseBody("Signup failed", "signup_error", { error }))
    }
}

export const login = async (request: Request, response: Response) => {
    try 
    {
        const { email, password } = request.body

        const existingUser = await findUserByEmail(email)
        if (!existingUser) {
            return response.status(404).send(setResponseBody("Invalid email address", "invalid_email", {}))
        }
        if(!existingUser.password)
        {
            return response.status(401).send(setResponseBody("Invalid password", "invalid_password"))
        }

        const validatePassword = await bcrypt.compare(password, existingUser.password)
        if (!validatePassword) {
            return response.status(401).send(setResponseBody("Invalid password", "invalid_password", {}))
        }

        const token = generateToken(existingUser._id.toString())
        setTokenCookie(response, "SessionID", token)

        response.send(
            setResponseBody("Login successful", null, {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            })
        )
    } 
    catch (error) {
        response.status(500).send(setResponseBody("Login failed", "login_error", { error }))
    }
}

export const logout = async (request: Request, response: Response) => {
    try 
    {
        const userCookie = request.cookies

        if (Object.keys(userCookie).length !== 0) 
        {
             if (userCookie.SessionID) 
            {
                clearTokenCookie(response, "SessionID")
                return response.status(200).send(setResponseBody("User has been logged out", null))
            } 
            else if (userCookie.googleAuthToken) 
            {
                clearTokenCookie(response, "googleAuthToken")
                return response.status(200).send(setResponseBody("User has been logged out", null))
            } 
            else 
            {
                return response.status(400).send(setResponseBody("Invalid operation: No valid token found", "invalid_token_error"))
            }
        }
        return response.status(204).send(setResponseBody("No active session found", "no_session_error", {}));
    } 
    catch (error: any) {
        return response.status(500).send(setResponseBody(error.message, "server_error"))
    }
}