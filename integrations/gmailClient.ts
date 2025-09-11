import { google } from "googleapis";

export const listEmailsFromGmail = async (
  oauth2Client: any,
  pageToken?: string,
  maxResults = 10
) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const messageData = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    pageToken,
  });
  return messageData.data;
};

export const getEmailDetails = async (oauth2Client: any, messageId: string) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const msgDetails = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["Subject", "From", "To", "Date"],
  });
  const headers = msgDetails.data.payload?.headers || [];
  const subject = headers.find((h) => h.name === "Subject")?.value || "";
  const from = headers.find((h) => h.name === "From")?.value || "";
  const date = headers.find((h) => h.name === "Date")?.value || "";
  const to = headers.find((h: any) => h.name === "To")?.value || "";
  const isRead = !msgDetails.data.labelIds?.includes("UNREAD");
  const isDraft = msgDetails.data.labelIds?.includes("DRAFT") || false;
  
  return {
    subject,
    from,
    to,
    date,
    isRead,
    threadId: msgDetails.data.threadId,
    snippet: msgDetails.data.snippet,
    isDraft
  };
};

export const getDraftForMessage = async (oauth2Client: any, messageId: string) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const draftsRes = await gmail.users.drafts.list({
    userId: "me"
  });
  const draft = draftsRes.data.drafts?.find(d => d.message?.id === messageId);
  return draft|| null;
};

export const getFullMessage = async (oauth2Client: any, messageId: string, markAsRead = true) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  if (markAsRead && res.data.labelIds?.includes("UNREAD")) {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });
  }

  return res.data; 

};