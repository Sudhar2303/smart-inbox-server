import { Router } from "express";
import { listEmails, getFullEmailDetails, generateReplyController } from "../controllers/emailController";
import { verifyGoogleUser } from "../middlewares/oauthMiddleware";

const router = Router();

router.get("/emails", verifyGoogleUser, listEmails);
router.get("/emails/:messageId", verifyGoogleUser, getFullEmailDetails);
router.post("/emails/aisuggest",verifyGoogleUser, generateReplyController);

export default router;
