import { Request, Response } from "express";
import { Types } from "mongoose";
import { findOAuthTokenById } from "../services/oauthTokenservice"; 
import { createOAuthClient } from '../integrations/oauthClient';
import { setResponseBody } from '../utils/responseFormatter';
import { extractHtmlBody, htmlToPlainText } from "../utils/gmailParser";
import { findGeneratedReply, createGeneratedReply } from '../services/generatedReplyService';
import { isReplyWorthyFromHeaders } from '../utils/emailUtils';
import { generateAIReply, detectMeetingDetails } from '../integrations/aiReplyGenerator';
import { listEmailsFromGmail, getDraftForMessage, getEmailDetails, getFullMessage } from '../integrations/gmailClient';
import { checkConflicts, createCalendarEvent } from '../integrations/calendarClient';

const pageTokensMap: Record<string, string[]> = {};

export const listEmails = async (request: Request, response: Response) => {
  try {
    const userIdObj = (request.user as { _id: Types.ObjectId })._id;
    const userIdStr = userIdObj.toString();

    const oauthToken = await findOAuthTokenById(userIdObj, "google");
    if (!oauthToken?.refreshToken) {
      return response.status(401).send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);

    const page = parseInt(request.query.page as string) || 1;
    const maxResults = 15;

    const pageTokens = pageTokensMap[userIdStr] || [];
    const pageToken = page > 1 ? pageTokens[page - 2] : undefined;

    const emailListData = await listEmailsFromGmail(oauth2Client, pageToken, maxResults);
    const messages = emailListData.messages || [];
    const nextPageToken = emailListData.nextPageToken || null;

    if (nextPageToken && pageTokens.length < page) {
      pageTokens.push(nextPageToken);
      pageTokensMap[userIdStr] = pageTokens;
    }

    const detailedMessages = await Promise.all(
      messages.map(async (msg) => {
        const details = await getEmailDetails(oauth2Client, msg.id!);
        const draft = await getDraftForMessage(oauth2Client, msg.id!);

        return { ...details, id: msg.id, draftId: draft?.id || null };
      })
    );

    return response
      .status(200)
      .send(setResponseBody("Emails fetched successfully", null, { page, emails: detailedMessages }));
  } catch (error: any) {
    return response.status(500).send(setResponseBody(error.message, "server_error"));
  }
};

export const getFullEmailDetails = async (request: Request, response: Response) => {
  try {
    const { messageId } = request.params;
    const userIdObj = (request.user as { _id: Types.ObjectId })._id;

    const oauthToken = await findOAuthTokenById(userIdObj, "google");
    if (!oauthToken || !oauthToken.refreshToken) {
      return response.status(401).send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);
    const msg = await getFullMessage(oauth2Client, messageId);
    
    const headers = msg.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    const to = headers.find((h: any) => h.name === "To")?.value || "";
    const date = headers.find((h: any) => h.name === "Date")?.value || "";
    const isDraft = msg.labelIds?.includes("DRAFT") || false;

    const draft = await getDraftForMessage(oauth2Client, msg.id!);
    const draftId = draft?.id ?? null;

    const htmlBody = extractHtmlBody(msg.payload);

    const mappedHeaders = headers.map((h: any) => ({ name: h.name || "", value: h.value || "" }));

    const aiSuggestion: "applicable" | "not_applicable" = isReplyWorthyFromHeaders(from, mappedHeaders, subject)
      ? "applicable"
      : "not_applicable";

    return response
      .status(200)
      .send(setResponseBody("Email fetched successfully", null, {
        id: msg.id,
        threadId: msg.threadId,
        subject,
        from,
        to,
        date,
        isDraft,
        snippet: msg.snippet,
        body: htmlBody,
        aiSuggestion,
        draftId,
      }));
  } catch (error: any) {
    return response.status(500).send(setResponseBody(error.message || "Internal server error", "server_error"));
  }
};

export const generateReplyController = async (request: Request, response: Response) => {
  try {
    const { emailBody, threadId } = request.body;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    if (!emailBody) {
      return response.status(400).send(setResponseBody("Email body is required", "validation_error"));
    }

    const existingReply = await findGeneratedReply(userId, threadId);

    if (existingReply) {
      return response.status(200).send(setResponseBody("Existing reply found", null, {suggestion: existingReply.suggestion,}));
    }

    let replyContext = "";
    let meetingInfo: any = null;

    const plain = await htmlToPlainText(emailBody)
    
    meetingInfo = await detectMeetingDetails(plain);

    if (meetingInfo) {
      const hasConflict = await checkConflicts(meetingInfo);
      if (hasConflict) {
        replyContext = `The requested meeting at ${meetingInfo.startTime} conflicts with another event. Suggest rescheduling.`;
      } else {
        await createCalendarEvent(meetingInfo);
        replyContext = `Meeting scheduled successfully for ${meetingInfo.startTime}.`;
      }
    } else {
      replyContext = "No meeting detected. Generate a normal reply.";
    }

    const finalReply = await generateAIReply(plain, replyContext);

    await createGeneratedReply(userId, threadId, finalReply);

    return response.status(200).send(setResponseBody("Reply generated successfully", null, { suggestion: finalReply }));
  
  } catch (error: any) {
    console.error("Error generating reply:", error);
    return response.status(500).send(setResponseBody(error.message || "Failed to generate reply", "server_error"));
  }
};
