export interface ScorePoint {
  heading: string;
  detail?: string | null;
  type?: "positive" | "negative";
}

/**
 * Parses a feedback/score string into structured ScorePoint[]
 * @param raw - JSON string or object array
 * @param defaultType - If provided, applies type when it cannot be inferred
 */
export function parseScorePoints(
  raw: string | unknown,
  defaultType?: "positive" | "negative"
): ScorePoint[] {
  if (!raw) return [];

  let data: any[] = [];

  try {
    // Handle already-parsed array
    if (typeof raw !== "string" && Array.isArray(raw)) {
      data = raw;
    } else if (typeof raw === "string") {
      data = JSON.parse(raw);
    }
  } catch (error) {
    console.error("Failed to parse score points:", error);
    return [];
  }

  return data.map((item) => {
    const heading = String(item.heading ?? "").trim();
    const detail = item.detail ?? null;

    // Infer type: simple heuristic
    let type: "positive" | "negative" | undefined = defaultType;

    if (!type) {
      const headingLower = heading.toLowerCase();
      const detailLower = (detail ?? "").toLowerCase();

      if (
        headingLower.includes("missing") ||
        headingLower.includes("insufficient") ||
        headingLower.includes("absent") ||
        headingLower.includes("concern") ||
        detailLower.includes("no ") ||
        detailLower.includes("lack")
      ) {
        type = "negative";
      } else {
        type = "positive";
      }
    }

    return { heading, detail, type };
  });
}
