import { body } from "express-validator";

export const signupValidation = [
  body("name")
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Name must be between 1 and 100 characters"),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 8, max: 20 })
    .withMessage("Password must be 8–20 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/)
    .withMessage("Password must include uppercase, lowercase, number and special character"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];
