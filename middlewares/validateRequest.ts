import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validateRequest = (request: Request, response: Response, next: NextFunction) => {
    const errors = validationResult(request)
    if (!errors.isEmpty()) 
    {
        return response.status(400).json({
            message: "Validation failed",
            error: errors.array(),
            data: {},
        })
    }
    next()
};
