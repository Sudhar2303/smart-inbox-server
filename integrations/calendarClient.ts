import { google } from "googleapis";
import { MeetingInfo } from "./aiReplyGenerator";

export const createOAuthClient = (refreshToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
};

const toIST = (dateString: string) => {
  return new Date(dateString).toISOString().replace("Z", "+05:30");
};

export const checkConflicts = async (meetingInfo: MeetingInfo, oauth2Client: any): Promise<boolean> => {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: toIST(meetingInfo.startTime),
        timeMax: toIST(meetingInfo.endTime),
        items: [{ id: "primary" }],
        timeZone: "Asia/Kolkata",
      },
    });
    const busySlots = res.data.calendars?.primary?.busy || [];
    return busySlots.length > 0;
  } catch (err) {
    console.error("Calendar conflict check failed:", err);
    return false;
  }
};

export const createCalendarEvent = async (
  meetingInfo: MeetingInfo,
  subject: string,
  oauth2Client: any
) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: subject,
      start: {
        dateTime: toIST(meetingInfo.startTime),
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: toIST(meetingInfo.endTime),
        timeZone: "Asia/Kolkata",
      },
    };

    const res = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return res.data;
  } catch (err) {
    console.error("Event creation failed:", err);
    throw err;
  }
};

export const checkDuplicateMeeting = async (
  meetingInfo: MeetingInfo,
  subject: string,
  oauth2Client: any
): Promise<boolean> => {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: meetingInfo.startTime,
      timeMax: meetingInfo.endTime,
      singleEvents: true,
      orderBy: "startTime",
      timeZone: "Asia/Kolkata",
    });

    const events = res.data.items || [];
    return events.some(event => {
      const sameSubject =
        event.summary?.toLowerCase().trim() === subject.toLowerCase().trim();

      const sameStart =
        new Date(event.start?.dateTime || "").getTime() ===
        new Date(meetingInfo.startTime).getTime();

      const sameEnd =
        new Date(event.end?.dateTime || "").getTime() ===
        new Date(meetingInfo.endTime).getTime();

      return sameSubject && sameStart && sameEnd;
    });
  } catch (err) {
    console.error("Duplicate meeting check failed:", err);
    return false;
  }
};
