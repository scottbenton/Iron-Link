import { ComponentProps } from "react";
import { useTranslation } from "react-i18next";

import { css, cx } from "styled-system/css";

import { buttonStyles } from "../../components/Button";
import { MAIN_CONTENT_ID } from "../shared/shell";

// The wrapper places the link, so the button's own styles stay whole.
const wrapperStyles = css({
  position: "absolute",
  top: "-80px",
  insetInlineStart: "2",
  zIndex: "tooltip",
  _focusWithin: { top: "2" },
});

export interface SkipLinkProps
  extends Omit<ComponentProps<"a">, "href" | "children"> {
  /** The id of the element to move to, usually `<main>`. */
  targetId?: string;
  label?: string;
}

/**
 * The first stop for Tab: a link past the navigation to the page's content.
 * It moves focus to the target itself (the target needs `tabIndex={-1}`),
 * so the address keeps no `#main-content` and Safari moves focus too.
 */
export function SkipLink(props: SkipLinkProps) {
  const { t } = useTranslation();
  const {
    targetId = MAIN_CONTENT_ID,
    label = t("ui.skip-link.label", "Skip to Content"),
    className,
    onClick,
    ...rest
  } = props;

  return (
    <div className={wrapperStyles}>
      <a
        href={`#${targetId}`}
        className={cx(buttonStyles({ variant: "primary" }), className)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          const target = document.getElementById(targetId);
          if (!target) return;
          event.preventDefault();
          target.focus();
          target.scrollIntoView({ block: "start" });
        }}
        {...rest}
      >
        {label}
      </a>
    </div>
  );
}
