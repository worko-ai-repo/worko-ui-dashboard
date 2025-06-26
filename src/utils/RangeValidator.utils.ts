/* import { FieldValues, UseFormSetError } from "react-hook-form";

export const validateRangeField = <T extends FieldValues>(
  label: string,
  getOtherValue: () => number,
  value: {
    min: number;
    max: number;
  },
  setError?: UseFormSetError<T>,
  setUnifiedFieldPath?: keyof T
) => {
  return (value: number) => {
    if (value < 0) {
      if (setError && setUnifiedFieldPath)
        setError(setUnifiedFieldPath, {
          type: "manual",
          message: `${label} cannot be negative`,
        });
      return true; // avoid blocking the individual field
    }

    const other = getOtherValue();

    if (compareAgainst === "max" && value > other) {
      if (setError && setUnifiedFieldPath)
        setError(setUnifiedFieldPath, {
          type: "manual",
          message: `Minimum ${label.toLowerCase()} cannot be greater than maximum`,
        });
      return true;
    }

    if (compareAgainst === "min" && value < other) {
      if (setError && setUnifiedFieldPath)
        setError(setUnifiedFieldPath, {
          type: "manual",
          message: `Maximum ${label.toLowerCase()} cannot be less than minimum`,
        });
      return true;
    }

    // If everything is valid, clear the unified error
    if (setError && setUnifiedFieldPath) {
      setError(setUnifiedFieldPath, { type: "manual", message: "" });
    }

    return true;
  };
};
 */