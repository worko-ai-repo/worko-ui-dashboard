  // Function to convert text to HTML format
/**
 * Converts plain text into HTML by transforming line breaks into `<br>` tags
 * and wrapping paragraphs in `<p>` tags.
 *
 * This function processes the input text by splitting it into paragraphs
 * based on double line breaks (`\n\n`). Each paragraph is trimmed and
 * converted into an HTML `<p>` element, with single line breaks (`\n`)
 * replaced by `<br>` tags. Empty paragraphs are ignored.
 *
 * @param text - The plain text input to be converted into HTML.
 * @returns The HTML string representation of the input text.
 *          Returns an empty string if the input text is falsy.
 */
  const convertToHtml = (text: string): string => {
    if (!text) return "";

    // Convert line breaks to <br> tags and wrap in <p> tags
    return text
      .split("\n\n") // Split by double line breaks for paragraphs
      .map((paragraph) => (paragraph.trim() ? `<p>${paragraph.replace(/\n/g, "<br>")}</p>` : ""))
      .filter(Boolean)
      .join("");
  };

  export default convertToHtml;