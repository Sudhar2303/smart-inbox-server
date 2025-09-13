import { Router } from "express";
import { listEmails, getFullEmailDetails, generateReplyController } from "../controllers/emailController";
import { verifyGoogleUser } from "../middlewares/oauthMiddleware";

const router = Router();

router.get("/", verifyGoogleUser, listEmails);
router.get("/:messageId", verifyGoogleUser, getFullEmailDetails);
router.post("/aisuggest",verifyGoogleUser, generateReplyController);

export default router;
