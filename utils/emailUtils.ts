const blockedDomains = [
  "quora.com",
  "linkedin.com",
  "facebookmail.com",
  "twitter.com",
  "amazon.in",
  "amazon.com",
  "noreply.",
  "no-reply.",
  "donotreply.",
  "support@",
  "updates@",
  "no-reply@",
  "notifications@",
  "alerts@",
  "mailer@",
  "info@",
  "notice@"
];

const blockedKeywords = [
  "newsletter",
  "do not reply",
  "no reply needed",
  "system notification",
  "notification",
  "update",
  "alert",
  "receipt",
  "order confirmation",
  "verification",
  "privacy policy",
  "terms and conditions",
  "consumer terms"
];


export const isReplyWorthy = (from: string, subject?: string): boolean => {
  if (!from) return false;

  const lowerFrom = from.toLowerCase();
  const lowerSubject = subject?.toLowerCase() || "";


  if (blockedDomains.some((domain) => lowerFrom.includes(domain))) {
    return false;
  }

  if (blockedKeywords.some((keyword) => lowerSubject.includes(keyword))) {
    return false;
  }

  return true;
};

export const isReplyWorthyFromHeaders = (
  from: string,
  headers: { name: string; value: string }[] = [],
  subject?: string
): boolean => {
  if (!isReplyWorthy(from, subject)) return false;

  const lowerHeaders = headers.map((h) => ({
    name: h.name.toLowerCase(),
    value: h.value.toLowerCase(),
  }));

  const hasUnsubscribe = lowerHeaders.some((h) => h.name === "list-unsubscribe");
  const isBulk = lowerHeaders.some(
    (h) => h.name === "precedence" && h.value === "bulk"
  );
  const autoSubmitted = lowerHeaders.some(
    (h) => h.name === "auto-submitted" && h.value !== "no"
  );

  if (hasUnsubscribe || isBulk || autoSubmitted) return false;

  return true;
};
