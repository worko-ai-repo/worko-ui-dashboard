export type ScorePoint = {
  heading: string;
  detail?: string | null;
  type?: "positive" | "negative";
};

/**
 * Utility to parse unstructured or structured text into ScorePoint[]
 */
export function parseScorePoints(input: unknown): ScorePoint[] {
  const isScorePointArray = (data: any): data is ScorePoint[] => {
    return Array.isArray(data) && data.every((item) => typeof item.heading === "string");
  };

  let parsed: unknown = input;

  if (typeof input === "string") {
    try {
      parsed = JSON.parse(input);
      if (isScorePointArray(parsed)) return parsed;
    } catch {
      // Not a valid JSON, continue to fallback parsing
    }
  }

  if (isScorePointArray(parsed)) return parsed;

  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
      if (isScorePointArray(parsed)) return parsed;
    } catch {
       console.warn("Failed to parse input as JSON, falling back to text parsing");
    }
  }

  if (typeof input === "string") {
    return parseFromText(input);
  }

  console.warn("Unable to parse input into ScorePoint[]");
  return [];
}

/**
 * Parse raw text using patterns and section context (positive/negative)
 */
function parseFromText(text: string): ScorePoint[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const result: ScorePoint[] = [];

  let currentSection: "positive" | "negative" = "positive";

  for (const line of lines) {
    // Detect markdown-style section headers
    const sectionMatch = line.match(/^#+\s*(.+)/);
    if (sectionMatch) {
      const sectionTitle = sectionMatch[1].trim().toLowerCase();
      // Fixed: Check for both singular and plural forms
      currentSection = /areas? of concern/i.test(sectionTitle) ? "negative" : "positive";
      continue;
    }

    // Determine if the line seems like a concern (for auto-tagging)
    const isConcern = /\b(does not|does not|does not provide|do not|gap|missing|lack|issue|concern|shortcoming|limitation|not mentioned|required but absent|absent|insufficient|incomplete|inadequate|deficient|weakness|not demonstrated|not shown|no experience|unfamiliar|not listed|not provided|not present|does not have|didn't mention|nonexistent|insufficiency|omitted|excluded|underrepresented|unaccounted|not specified|lack of|less exposure|doesn't meet|no mention|doesn't cover|not covered|unmet|not fulfilled)\b/i.test(line);
    const detectedType: "positive" | "negative" = isConcern ? "negative" : currentSection;

    // Pattern 1: - **Heading**: Detail
    const boldMatch = line.match(/^-?\s*\*\*(.+?)\*\*\s*:\s*(.+)$/);
    if (boldMatch) {
      const [, heading, detail] = boldMatch;
      result.push({
        heading: heading.trim().replace(/^\*\*+|\*\*+$/g, ''),
        detail: detail.trim().replace(/^\*\*+|\*\*+$/g, ''),
        type: detectedType,
      });
      continue;
    }

    // Pattern 2: 1. Heading: Detail
    const numberedMatch = line.match(/^\d+\.\s*(.+?):\s*(.+)$/);
    if (numberedMatch) {
      const [, heading, detail] = numberedMatch;
      result.push({
        heading: heading.trim().replace(/^\*\*+|\*\*+$/g, ''),
        detail: detail.trim().replace(/^\*\*+|\*\*+$/g, ''),
        type: detectedType,
      });
      continue;
    }

    // Pattern 3: Bullet (• or -) with colon
    const bulletMatch = line.match(/^[-•]\s*(.+?):\s*(.+)$/);
    if (bulletMatch) {
      const [, heading, detail] = bulletMatch;
      result.push({
        heading: heading.trim().replace(/^\*\*+|\*\*+$/g, ''),
        detail: detail.trim().replace(/^\*\*+|\*\*+$/g, ''),
        type: detectedType,
      });
      continue;
    }

    // Fallback: heading-only line
    result.push({
      heading: line.trim().replace(/^\*\*+|\*\*+$/g, ''),
      detail: null,
      type: detectedType,
    });
  }

  return result;
}