export interface ScorePoint {
  heading: string;
  detail?: string;
}

export const scorePoints: ScorePoint[] = [];

export function parseScorePoints(text: any): void {
  let points: ScorePoint[] = [];

  // Clear existing points
  scorePoints.length = 0;

  // Handle null/undefined/empty input
  if (!text) {
    console.warn("No text provided to parseScorePoints");
    return;
  }

  // 1. Handle if text is already a valid array
  if (Array.isArray(text) && text.every((item) => item.heading)) {
    const mergedPoints: { heading: string; detail?: string }[] = [];
    const concernDetails: string[] = [];

    for (const item of text) {
      if (item.heading === "Area of Concern") {
        if (item.detail) concernDetails.push(`- ${item.detail}`);
      } else {
        mergedPoints.push(item);
      }
    }

    if (concernDetails.length > 0) {
      mergedPoints.push({
        heading: "Area of Concern",
        detail: concernDetails.join("\n"),
      });
    }

    scorePoints.push(...mergedPoints);
    return;
  }

  // 2. Try to parse JSON string
  if (typeof text === "string") {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.every((item) => item.heading)) {
        scorePoints.push(...parsed);
        return;
      }
    } catch (e) {
      console.warn("JSON parse failed, attempting legacy parsing. Error", e);
    }

    // 3. Parse markdown-style format (like your input)
    const sections = text.split(/### /);

    for (const section of sections) {
      if (!section.trim()) continue;

      const lines = section.trim().split("\n");
      const heading = lines[0].trim();

      if (heading) {
        const bulletPoints: string[] = [];

        // Extract bullet points
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith("- **") && line.includes(":**")) {
            // Extract the bold heading and detail
            const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
            if (match) {
              bulletPoints.push(`${match[1]}: ${match[2]}`);
            }
          } else if (line.startsWith("- ")) {
            bulletPoints.push(line.substring(2));
          }
        }

        points.push({
          heading,
          detail: bulletPoints.length > 0 ? bulletPoints.join("\n") : undefined,
        });
      }
    }

    // 4. Fallback: Try numbered format
    if (points.length === 0) {
      const numberRegex = /(?:^|\n)(\d+)\.\s+(.*?)(?=\n\d+\.|\n*$)/gs;
      const numberMatches = Array.from(text.matchAll(numberRegex));

      for (const match of numberMatches) {
        const fullPoint = match[2].trim();
        const splitIndex = fullPoint.indexOf(":");
        if (splitIndex !== -1) {
          const heading = fullPoint.slice(0, splitIndex).trim();
          const detail = fullPoint.slice(splitIndex + 1).trim();
          points.push({ heading, detail });
        } else {
          points.push({ heading: fullPoint });
        }
      }
    }

    // 5. Fallback: Try bullet format
    if (points.length === 0) {
      const bulletRegex = /•\s*(.*?)(?=\n•|$)/gs;
      const bulletMatches = Array.from(text.matchAll(bulletRegex));

      for (const match of bulletMatches) {
        const fullPoint = match[1].trim();
        const splitIndex = fullPoint.indexOf(":");
        if (splitIndex !== -1) {
          const heading = fullPoint.slice(0, splitIndex).trim();
          const detail = fullPoint.slice(splitIndex + 1).trim();
          points.push({ heading, detail });
        } else {
          points.push({ heading: fullPoint });
        }
      }
    }

    // 6. Fallback: Try dash format
    if (points.length === 0) {
      const dashRegex = /-\s+\*\*(.*?)\*\*:\s*(.*?)(?=\n-|$)/gs;
      const dashMatches = Array.from(text.matchAll(dashRegex));

      for (const match of dashMatches) {
        const heading = match[1].trim();
        const detail = match[2].trim();
        points.push({ heading, detail });
      }
    }
  }

  // Assign parsed points to the scorePoints array
  if (points.length > 0) {
    scorePoints.push(...points);
    console.log("Successfully parsed score points:", points);
  } else {
    console.warn("No recognizable format found for score points.");
  }
}
