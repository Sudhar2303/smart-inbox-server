import { Router } from "express";
import { createDraft, updateDraft, deleteDraft, sendEmail } from "../controllers/draftController";
import { verifyGoogleUser } from "../middlewares/oauthMiddleware";
import { validateRequest } from '../middlewares/validateRequest'
import { createDraftValidator, updateDraftValidator,sendDraftValidator,deleteDraftValidator} from '../validators/draftValidators'
const router = Router();

router.post("/", verifyGoogleUser, createDraftValidator, validateRequest, createDraft);

router.put("/update", verifyGoogleUser,updateDraftValidator, validateRequest, updateDraft);

router.delete("/:draftId", verifyGoogleUser,deleteDraftValidator, validateRequest, deleteDraft);

router.post("/send", verifyGoogleUser,sendDraftValidator, validateRequest, sendEmail);

export default router;
