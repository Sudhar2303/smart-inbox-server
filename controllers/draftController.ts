import { Request, Response } from "express";
import { google } from "googleapis";
import { findOAuthTokenById } from "../services/oauthTokenservice"; 
import { createOAuthClient } from '../integrations/oauthClient';
import { setResponseBody } from '../utils/responseFormatter';
import { Types } from "mongoose";
import { markReplyAsUsed } from '../services/generatedReplyService'

export const createDraft = async (request: Request, response: Response) => {
  try {
    const { to, subject, body, threadId } = request.body;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    const oauthToken = await findOAuthTokenById(userId, "google");
    if (!oauthToken?.refreshToken) {
      return response.status(401).send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const draftRes = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          threadId: threadId || undefined,
          raw: Buffer.from(
            `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`
          ).toString("base64url")
        }
      }
    });

    if (threadId) {
      await markReplyAsUsed(userId, threadId);
    }
    return response.status(200).send(setResponseBody("Draft created", null, { draftId: draftRes.data.id }));
  } catch (error: any) {
    return response.status(500).send(setResponseBody(error.message, "server_error"));
  }
};

export const updateDraft = async (request: Request, response: Response) => {
  try {
    const { draftId, to, subject, body } = request.body;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    const oauthToken = await findOAuthTokenById(userId, "google");
    if (!oauthToken?.refreshToken) {
      return response
        .status(401)
        .send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });


    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=UTF-8`,
      "",
      body,
    ].join("\r\n");

    await gmail.users.drafts.update({
      userId: "me",
      id: draftId,
      requestBody: {
        message: {
          raw: Buffer.from(message)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, ""), // Base64url format
        },
      },
    });

    return response.status(200).send(setResponseBody("Draft updated", null));
  } catch (error: any) {
    return response
      .status(500)
      .send(setResponseBody(error.message, "server_error"));
  }
};


export const deleteDraft = async (request: Request, response: Response) => {
  try {
    const { draftId } = request.params;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    const oauthToken = await findOAuthTokenById(userId, "google");
    if (!oauthToken?.refreshToken) {
      return response.status(401).send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    await gmail.users.drafts.delete({ userId: "me", id : draftId });

    return response.status(200).send(setResponseBody("Draft deleted",null));
  } catch (error: any) {
    return response.status(500).send(setResponseBody(error.message, "server_error"));
  }
};

export const sendEmail = async (request: Request, response: Response) => {
  try {
    const { draftId, to, subject, body, threadId } = request.body;
    const userId = (request.user as { _id: Types.ObjectId })._id;

    const oauthToken = await findOAuthTokenById(userId, "google");
    if (!oauthToken?.refreshToken) {
      return response.status(401).send(setResponseBody("No Google token found", "authentication_error"));
    }

    const oauth2Client = createOAuthClient(oauthToken.refreshToken);
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    console.log(draftId)
    if (draftId) {
      await gmail.users.drafts.send({ userId: "me", requestBody: { id: draftId } });
      return response.json(setResponseBody("Draft sent",null));
    } else {
      await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          threadId: threadId || undefined,
          raw: Buffer.from(
            `To: ${to}\r\nSubject: ${subject}\r\n\r\n${body}`
          ).toString("base64url")
        }
      });
      return response.json(setResponseBody("Email sent",null));
    }
  } catch (error: any) {
    return response.status(500).send(setResponseBody(error.message, "server_error"));
  }
};
