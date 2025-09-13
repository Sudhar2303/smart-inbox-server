import { Router } from "express";
import { verifyGoogleUser } from "../middlewares/oauthMiddleware";
import { createNewCalendarEvent, getMeetingInfo } from "../controllers/calendarController";

const router = Router();

router.post("/createevent", verifyGoogleUser, createNewCalendarEvent);
router.post("/getmeetinfo", verifyGoogleUser, getMeetingInfo)

export default router;
