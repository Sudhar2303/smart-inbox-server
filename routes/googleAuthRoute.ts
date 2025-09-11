import { Router } from "express";
import passport from "passport";
import { authenticateWithGoogle, verifyGoogleUser } from "../middlewares/oauthMiddleware";
import { getAuthenticationStatus, googleAuthCallback } from "../controllers/googleAuthController";

const router = Router();

router.get("/login", authenticateWithGoogle)

router.get("/callback",passport.authenticate("google", { session: false }),googleAuthCallback)

router.get("/getauthstatus",verifyGoogleUser,getAuthenticationStatus)

export default router;
