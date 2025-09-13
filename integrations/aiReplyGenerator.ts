interface GeminiPart {
  text: string;
}

interface GeminiContent {
  parts: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content: GeminiContent;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

export const generateAIReply = async (
  emailBody: string,
  context: string
): Promise<string> => {
  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      systemInstruction: {
        parts: [
          {
            text: `You are a professional assistant. Write a polished, formal, and professional email reply to the user's email. Context: ${context}`
          }
        ]
      },
      contents: [
        {
          parts: [{ text: emailBody }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.2,
        candidateCount: 1,
      },
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result: GeminiResponse = await response.json();

    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
    return generatedText || "No reply suggestion available.";

  } catch (error) {
    console.error("AI generation failed:", error);
    return "Unable to generate a reply suggestion at this time.";
  }
};

export interface MeetingInfo {
  subject: string;
  startTime: string;
  endTime: string;
}

export const detectMeetingDetails = async (
  emailBody: string
): Promise<MeetingInfo | null> => {
  try {
    if (!emailBody || emailBody.trim() === "") return null;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      systemInstruction: {
        parts: [
          {
            text: `
You are an expert meeting extractor. From the email below, extract meeting details in valid JSON format:
{
  "subject": "string",
  "startTime": "YYYY-MM-DDTHH:MM:SSZ",
  "endTime": "YYYY-MM-DDTHH:MM:SSZ"
}
Rules:
1. Return ONLY JSON. No explanations.
2. Return null if no meeting is scheduled.
3. Compute actual UTC time if the email uses relative dates like 'tomorrow', 'next Monday'.
4. If only start time is mentioned, set endTime = startTime + 1 hour.

Email: """${emailBody}"""
            `
          }
        ]
      },
      contents: [{ parts: [{ text: emailBody }] }],
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0
      },
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Extractor failed: ${response.status}`);
    const result = await response.json();

    let extracted: string | undefined;

    if (Array.isArray(result?.candidates)) {
      for (const cand of result.candidates) {
        if (Array.isArray(cand.content)) {
          extracted = cand.content[0]?.parts?.[0]?.text?.trim();
        } else if (cand.content?.parts?.length) {
          extracted = cand.content.parts[0]?.text?.trim();
        } else if (cand.content?.text) {
          extracted = cand.content.text.trim();
        }
        if (extracted) break;
      }
    }

    if (!extracted || extracted.toLowerCase() === "null") return null;

    const jsonMatch = extracted.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed: MeetingInfo = JSON.parse(jsonMatch[0]);

    parsed.subject ||= "Interview Meeting";

    parsed.startTime = new Date(parsed.startTime).toISOString();

    if (!parsed.endTime || isNaN(new Date(parsed.endTime).getTime())) {
      parsed.endTime = new Date(new Date(parsed.startTime).getTime() + 60 * 60 * 1000).toISOString();
    } else {
      parsed.endTime = new Date(parsed.endTime).toISOString();
    }

    return parsed;
  } catch (err) {
    console.error("Meeting extraction failed:", err);
    return null;
  }
};
