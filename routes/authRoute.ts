import { Router } from "express"
import { signup, login, logout } from "../controllers/authController"
import { signupValidation, loginValidation } from '../validators/authValidators'
import { validateRequest } from '../middlewares/validateRequest'

const router = Router()

router.post("/signup", signupValidation, validateRequest, signup);
router.post("/login", loginValidation, validateRequest, login);
router.post("/logout", logout);

export default router;