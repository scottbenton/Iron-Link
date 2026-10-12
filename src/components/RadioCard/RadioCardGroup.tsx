import { Box, type SxProps, type Theme } from "@mui/material";
import { type KeyboardEvent, type ReactNode, useRef } from "react";

import type { RadioCardControlProps } from "./RadioCard";

// A radio group of cards. Arrow keys, Home and End move the selection between
// available cards, and Tab reaches only the selected (or first available) one.
export function RadioCardGroup<T extends string>({
  label,
  options,
  value,
  disabled = false,
  isOptionDisabled,
  onChange,
  renderCard,
  sx,
}: {
  label: string;
  options: T[];
  value: T | null | undefined;
  disabled?: boolean;
  isOptionDisabled?: (option: T) => boolean;
  onChange: (option: T) => void;
  renderCard: (option: T, control: RadioCardControlProps) => ReactNode;
  // Layout of the grid, such as its columns.
  sx?: SxProps<Theme>;
}) {
  const cards = useRef<Partial<Record<T, HTMLButtonElement>>>({});
  const available = options.filter(
    (option) => !disabled && !isOptionDisabled?.(option),
  );
  const focusable =
    value != null && available.includes(value) ? value : available[0];
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = value == null ? -1 : available.indexOf(value);
    let next: T | undefined;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next =
          index >= 0 && index < available.length - 1
            ? available[index + 1]
            : available[0];
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next =
          index > 0 ? available[index - 1] : available[available.length - 1];
        break;
      case "Home":
        next = available[0];
        break;
      case "End":
        next = available[available.length - 1];
        break;
      default:
        return;
    }
    event.preventDefault();
    if (!next) return;
    cards.current[next]?.focus();
    if (next !== value) onChange(next);
  };
  return (
    <Box
      role="radiogroup"
      aria-label={label}
      sx={[{ display: "grid", gap: 2 }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {options.map((option) => (
        <Box key={option} sx={{ minWidth: 0 }}>
          {renderCard(option, {
            ref: (element: HTMLButtonElement | null) => {
              if (element) cards.current[option] = element;
              else delete cards.current[option];
            },
            selected: option === value,
            focusable: option === focusable,
            disabled: disabled || !!isOptionDisabled?.(option),
            onSelect: () => onChange(option),
            onKeyDown: move,
          })}
        </Box>
      ))}
    </Box>
  );
}
