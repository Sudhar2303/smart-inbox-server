import { google } from "googleapis";
import { MeetingInfo } from "./aiReplyGenerator";

const calendar = google.calendar("v3");

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

auth.setCredentials({
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const checkConflicts = async (meetingInfo: MeetingInfo): Promise<boolean> => {
  try {
    const res = await calendar.freebusy.query({
      auth,
      requestBody: {
        timeMin: meetingInfo.startTime,
        timeMax: meetingInfo.endTime,
        items: [{ id: "primary" }],
      },
    });

    const busySlots = res.data.calendars?.primary?.busy || [];
    return busySlots.length > 0; 
  } catch (err) {
    console.error("Calendar conflict check failed:", err);
    return false; 
  }
};

export const createCalendarEvent = async (meetingInfo: MeetingInfo) => {
  try {
    const event = {
      summary: meetingInfo.subject,
      start: { dateTime: meetingInfo.startTime },
      end: { dateTime: meetingInfo.endTime },
      attendees: meetingInfo.attendees?.map(email => ({ email })) || [],
    };

    const res = await calendar.events.insert({
      auth,
      calendarId: "primary",
      requestBody: event,
    });

    return res.data;
  } catch (err) {
    console.error("Event creation failed:", err);
    throw err;
  }
};
