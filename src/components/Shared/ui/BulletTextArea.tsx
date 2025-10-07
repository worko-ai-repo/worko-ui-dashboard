"use client";

import * as React from "react";

const BULLET = "• ";
const BULLET_REGEX = /^\s*•\s?/;

function normalizeToBulletedDisplay(value: string) {
  const lines = value.split(/\r?\n/);
  const normalized = lines.map((l) => {
    const stripped = l.replace(BULLET_REGEX, "");
    return stripped.length ? `${BULLET}${stripped}` : "";
  });
  return normalized.join("\n");
}

function extractPlainLines(displayValue: string) {
  return displayValue
    .split(/\r?\n/)
    .map((l) => l.replace(BULLET_REGEX, "").trimEnd())
    .filter((l) => l.trim().length > 0);
}

interface BulletTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  name: string;
  delimiter?: string;
  error?: string;
}

export const BulletTextarea = React.forwardRef<HTMLTextAreaElement, BulletTextareaProps>(
  ({ value = "", onChange, name, delimiter = "||NL||", error, className = "", ...rest }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // merge forwarded ref (for react-hook-form)
    React.useEffect(() => {
      if (!ref) return;
      if (typeof ref === "function") ref(textareaRef.current);
      else (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = textareaRef.current;
    }, [ref]);

    // display value for user
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      normalizeToBulletedDisplay(value.split(delimiter).join("\n") || BULLET)
    );

    // update when external value changes (like form reset)
    React.useEffect(() => {
      const restored = value ? value.split(delimiter).join("\n") : "";
      setDisplayValue(normalizeToBulletedDisplay(restored || BULLET));
    }, [value, delimiter]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextDisplay = normalizeToBulletedDisplay(e.target.value);
      setDisplayValue(nextDisplay || BULLET);

      const plain = extractPlainLines(nextDisplay).join(delimiter);

      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name,
          value: plain,
        },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onChange?.(syntheticEvent);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;

      // auto prepend bullet at top if user deletes it
      if (
        (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") &&
        ta.selectionStart === 0 &&
        !BULLET_REGEX.test(ta.value)
      ) {
        const next = normalizeToBulletedDisplay(ta.value);
        setDisplayValue(next || BULLET);
      }

      // handle Enter to create new bullet
      if (e.key === "Enter") {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = ta.value.slice(0, start);
        const after = ta.value.slice(end);
        const insertion = `\n${BULLET}`;
        const next = before + insertion + after;
        const normalized = normalizeToBulletedDisplay(next);
        setDisplayValue(normalized);

        requestAnimationFrame(() => {
          if (!textareaRef.current) return;
          const pos = (before + insertion).length;
          textareaRef.current.selectionStart = pos;
          textareaRef.current.selectionEnd = pos;
        });
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const ta = textareaRef.current;
      if (!ta) return;
      e.preventDefault();

      const text = e.clipboardData.getData("text");
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = ta.value.slice(0, start);
      const after = ta.value.slice(end);

      const pasted = text
        .split(/\r?\n/)
        .map((l, idx) => (idx === 0 ? l : `\n${BULLET}${l.replace(BULLET_REGEX, "")}`))
        .join("");

      const next = before + pasted + after;
      const normalized = normalizeToBulletedDisplay(next);
      setDisplayValue(normalized);

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const pos = (before + pasted).length;
        textareaRef.current.selectionStart = pos;
        textareaRef.current.selectionEnd = pos;
      });
    };

    return (
      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          name={name}
          className={`w-full min-h-[120px] rounded-xl bg-gray-100 p-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            error ? "border border-red-500" : ""
          } ${className}`}
          {...rest}
        />

        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

BulletTextarea.displayName = "BulletTextarea";
