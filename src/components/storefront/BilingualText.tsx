import type { HTMLAttributes } from "react";

interface BilingualTextProps extends HTMLAttributes<HTMLSpanElement> {
  primary: string;
  secondary: string;
  compact?: boolean;
}

export function BilingualText({
  primary,
  secondary,
  compact = false,
  className = "",
  ...props
}: BilingualTextProps) {
  return (
    <span className={`inline-flex min-w-0 flex-col leading-tight ${className}`} {...props}>
      <span>{primary}</span>
      <span
        className={
          compact ? "text-[0.72em] font-normal opacity-65" : "text-[0.78em] font-normal opacity-70"
        }
      >
        {secondary}
      </span>
    </span>
  );
}
