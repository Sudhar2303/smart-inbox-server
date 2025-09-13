import { Request, Response } from "express";
import { Types } from "mongoose";
import { setResponseBody } from '../utils/responseFormatter';
import { htmlToPlainText } from "../utils/gmailParser";
import { detectMeetingDetails, MeetingInfo } from '../integrations/aiReplyGenerator';
import { checkConflicts, createCalendarEvent, checkDuplicateMeeting, createOAuthClient } from "../integrations/calendarClient";
import { findOAuthTokenById } from "../services/oauthTokenservice"; 

export const getMeetingInfo = async (request: Request, response: Response) => {
  try {
    const { subject, emailBody } = request.body;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    if (!subject || !emailBody) {
      return response
        .status(400)
        .send(setResponseBody("Subject and email body are required", "validation_error"));
    }

    const plain = await htmlToPlainText(emailBody);
    const meetingInfo = await detectMeetingDetails(plain);

    if (!meetingInfo) {
      return response
        .status(200)
        .send(
          setResponseBody("No meeting detected", null, { 
            status: "no", 
            meeting: null,
            flags: { isDuplicate: false, hasConflict: false }
          })
        );
    }

    const oauthToken = await findOAuthTokenById(userId, "google");
    if (!oauthToken?.refreshToken) {
      return response
        .status(401)
        .send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);

    const hasConflict = await checkConflicts(meetingInfo, oauth2Client);
    const isDuplicate = await checkDuplicateMeeting(meetingInfo, subject, oauth2Client);

    let status: "available" | "conflict" | "duplicate";
    if (isDuplicate) status = "duplicate";
    else if (hasConflict) status = "conflict";
    else status = "available";

    return response.status(200).send(
      setResponseBody("Meeting analyzed successfully", null, {
        status,
        meeting: meetingInfo,
        flags: { isDuplicate, hasConflict }
      })
    );
  } catch (error: any) {
    console.error("Error getting meeting info:", error);
    return response
      .status(500)
      .send(setResponseBody(error.message || "Failed to analyze meeting", "server_error"));
  }
};

export const createNewCalendarEvent = async (request: Request, response: Response) => {
  try {
    const { meetingInfo, subject } = request.body;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    if (!meetingInfo) {
      return response
        .status(400)
        .send(setResponseBody("meetingInfo is required", "validation_error"));
    }

    const oauthToken = await findOAuthTokenById(userId, "google");
    if (!oauthToken?.refreshToken) {
      return response
        .status(401)
        .send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);

    const event = await createCalendarEvent(meetingInfo, subject, oauth2Client);

    return response
      .status(200)
      .send(setResponseBody("Calendar event created successfully", null, { event }));
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return response
      .status(500)
      .send(setResponseBody(error.message || "Failed to create calendar event", "server_error"));
  }
};
