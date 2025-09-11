export const generateAIReply = async (emailBody: string, context: string): Promise<string> => {
  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {

      systemInstruction: {
        parts: [{ text: "You are a professional assistant. Write a polished, formal, and professional email reply to the user's email." },
          { text: `Additional context: ${context}` }]
      },
      
      contents: [{
        parts: [{ text: emailBody }],
      }],
      generationConfig: {
         maxOutputTokens: 1000,
      },
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();

    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      return generatedText.trim();
    } else {
      return "No reply suggestion available.";
    }

  } catch (error) {
    console.error("AI generation failed:", error);
    return "Unable to generate a reply suggestion at this time.";
  }
};

export interface MeetingInfo {
  subject: string;
  startTime: string;
  endTime: string; 
  attendees?: string[];
}

export const detectMeetingDetails = async (emailBody: string): Promise<MeetingInfo | null> => {
  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      systemInstruction: {
        parts: [{
          text: `Extract meeting details from the email and return only a valid JSON in this format:
{
  "subject": "Project discussion",
  "startTime": "2025-09-10T14:00:00Z",
  "endTime": "2025-09-10T15:00:00Z",
  "attendees": ["person1@example.com", "person2@example.com"]
}

If no meeting is detected, return exactly: null`
        }]
      },
      contents: [{ parts: [{ text: emailBody }] }],
      generationConfig: {
        maxOutputTokens: 300,
      }
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Extractor failed: ${response.status}`);
    const result = await response.json();

    const extracted = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!extracted || extracted.toLowerCase() === "null") return null;

    return JSON.parse(extracted) as MeetingInfo;
  } catch (err) {
    console.error("Meeting extraction failed:", err);
    return null;
  }
};
