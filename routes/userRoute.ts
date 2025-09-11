import { Router } from "express"
import { getUserInfo } from "../controllers/usercontroller"
import { verifyGoogleUser } from "../middlewares/oauthMiddleware"

const router = Router()

router.get("/userDetails", verifyGoogleUser, getUserInfo);

export default router;