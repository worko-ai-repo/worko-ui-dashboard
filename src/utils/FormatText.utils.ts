/**
 * Formats an object key for display by:
 * - Converting camelCase to separate words
 * - Removing underscores and hyphens
 * - Capitalizing each word
 *
 * @param key - The key to format
 * @returns Formatted display text
 *
 * @example
 * formatKeyForDisplay("domainExpertise") // "Domain Expertise"
 * formatKeyForDisplay("communication_skills") // "Communication Skills"
 * formatKeyForDisplay("some-long-key") // "Some Long Key"
 */
export const formatKeyForDisplay = (key: string): string => {
  return (
    key
      // Insert space before capital letters (camelCase)
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, " ")
      // Capitalize first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
      // Remove extra spaces
      .trim()
  );
};

/**
 * Converts an object with string keys and numeric values into a displayable format
 *
 * @param obj - Object with string keys and any values
 * @returns Array of formatted key-value pairs for display
 *
 * @example
 * const breakdown = { domainExpertise: 88, communication_skills: 92 };
 * formatObjectForDisplay(breakdown)
 * // Returns: [{ label: "Domain Expertise", value: 88 }, { label: "Communication Skills", value: 92 }]
 */
export const formatObjectForDisplay = (
  obj: Record<string, any>
): Array<{ label: string; value: any }> => {
  return Object.entries(obj).map(([key, value]) => ({
    label: formatKeyForDisplay(key),
    value: value,
  }));
};
