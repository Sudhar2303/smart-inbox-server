import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export const decodeBase64Url = (data?: string): string => {
  if (!data) return "";
  let base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64").toString("utf-8");
};

export const extractHtmlBody = (payload: any): string => {
  let html = "";

  const processPart = (part: any) => {
    if (part.mimeType === "text/html" && part.body?.data) {
      html = decodeBase64Url(part.body.data);
    }
    if (part.parts) part.parts.forEach(processPart);
  };

  if (payload.parts) payload.parts.forEach(processPart);
  else if (payload.body?.data) html = decodeBase64Url(payload.body.data);

  return html;
};

export const htmlToPlainText = (html: string): string => {
  if (!html) return "";

  const window = new JSDOM("").window;
  const DOMPurify = createDOMPurify(window);

  const sanitizedHtml = DOMPurify.sanitize(html);

  const dom = new JSDOM(sanitizedHtml);
  const text = dom.window.document.body.textContent || "";

  return text
    .replace(/\u00A0/g, " ") 
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .trim();
};
