import { css } from "styled-system/css";

/** Token name (`bg.surface`) to its CSS variable (`--colors-bg-surface`). */
export function tokenVar(category: string, name: string) {
  const kebab = name
    .replace(/\./g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
  return `var(--${category}-${kebab})`;
}

export const swatchGridStyles = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(132px, 1fr))",
  gap: "4",
});

export const pageStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "8",
  padding: "6",
  maxWidth: "1040px",
  color: "fg.default",
});

export const sectionStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});
