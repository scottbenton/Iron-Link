import { Box, Theme } from "@mui/material";
import {
  FocusEvent,
  PointerEvent,
  Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { NormalRollActions } from "pages/games/characterSheet/components/GameLog/NormalRollActions";
import { useGameIdOptional } from "pages/games/gamePageLayout/hooks/useGameId";

import { VisibleRoll } from "stores/appState.store";

import { NewRollRing } from "./NewRollRing";
import { RollSnackbar } from "./RollSnackbar";

// The newest roll and the two before it.
export const MAX_STACKED_ROLLS = 3;
// How far each older card's edge shows above the one in front of it.
const PEEK_OFFSET = 8;
// How much smaller each older card is drawn while the stack is collapsed.
const PEEK_SCALE_STEP = 0.05;
// The space between cards once the stack is expanded.
const EXPANDED_GAP = 8;

export interface ExpandableRollStackProps {
  // Oldest first, as the store keeps them.
  rolls: VisibleRoll[];
  // The roll whose card gets the new roll ring.
  flashRollId: string | null;
  onDismiss: (rollKey: string) => void;
  getDismissButtonRef: (rollKey: string) => Ref<HTMLButtonElement>;
}

/**
 * The wide screen roll stack: the newest card in full with the edges of the
 * two before it peeking out above it. While the pointer is over it or focus
 * is inside it, the older cards slide up into full cards of their own; until
 * then they are hidden from screen readers and cannot take focus. The
 * expansion is drawn with transforms only, so the stack's layout height (and
 * what docks above it) never changes.
 */
export function ExpandableRollStack(props: ExpandableRollStackProps) {
  const { rolls, flashRollId, onDismiss, getDismissButtonRef } = props;
  const gameId = useGameIdOptional();

  // Newest first: the front card, then the older ones behind it.
  const cards = rolls.slice(-MAX_STACKED_ROLLS).reverse();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  // A tap opens the stack until a tap lands outside it, since touch has no
  // hover to leave.
  const [isOpenedByTouch, setIsOpenedByTouch] = useState(false);

  const isExpanded =
    cards.length > 1 && (isHovered || hasFocusWithin || isOpenedByTouch);

  // A focused card that is dismissed takes focus with it without a blur, so
  // focus is checked again whenever the rolls change.
  useEffect(() => {
    const container = containerRef.current;
    setHasFocusWithin(
      !!container && container.contains(document.activeElement),
    );
  }, [rolls]);

  useEffect(() => {
    if (!isOpenedByTouch) return;
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpenedByTouch(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isOpenedByTouch]);

  const heights = useCardHeights();
  const getHeight = (rollKey: string) => heights.heights[rollKey] ?? 0;

  // How far each older card rises once expanded: past every newer card and
  // its gap.
  const expandedOffsets: number[] = [];
  let offset = 0;
  cards.forEach(({ roll }, depth) => {
    if (depth > 0) offset += getHeight(roll.id) + EXPANDED_GAP;
    expandedOffsets.push(offset);
  });
  const frontHeight = cards[0] ? getHeight(cards[0].roll.id) : 0;

  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== "touch") setIsHovered(true);
  };
  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "touch") setIsHovered(false);
  };
  const handlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === "touch") setIsOpenedByTouch(true);
  };
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setHasFocusWithin(false);
    }
  };

  return (
    <Box
      ref={containerRef}
      data-testid={"roll-stack"}
      data-expanded={isExpanded ? "true" : "false"}
      position={"relative"}
      width={"100%"}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onFocus={() => setHasFocusWithin(true)}
      onBlur={handleBlur}
      sx={{ pointerEvents: "all", isolation: "isolate" }}
    >
      {/* Fills the space the older cards rise into, gaps included, so the
          pointer stays over the stack on its way between them. */}
      {isExpanded && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "100%",
            height: expandedOffsets[expandedOffsets.length - 1],
            zIndex: 0,
          }}
        />
      )}
      {cards.map(({ id, roll }, depth) => {
        const isFront = depth === 0;
        const isHidden = !isFront && !isExpanded;

        let transform = "none";
        if (!isFront) {
          transform = isExpanded
            ? `translateY(${-expandedOffsets[depth]}px)`
            : `translateY(${-PEEK_OFFSET * depth}px) scale(${
                1 - PEEK_SCALE_STEP * depth
              })`;
        }

        return (
          <Box
            key={roll.id}
            ref={heights.getRef(roll.id)}
            data-roll-key={roll.id}
            data-testid={isFront ? "roll-stack-front" : "roll-stack-older"}
            aria-hidden={isHidden || undefined}
            inert={isHidden || undefined}
            sx={(theme) => ({
              position: isFront ? "relative" : "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: MAX_STACKED_ROLLS - depth,
              transform,
              transformOrigin: "top center",
              transition: theme.transitions.create("transform", {
                duration: theme.transitions.duration.shorter,
                easing: theme.transitions.easing.easeOut,
              }),
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
              },
            })}
          >
            {isFront && flashRollId === roll.id && (
              <NewRollRing key={`ring-${flashRollId}`} />
            )}
            {!isFront && (
              // The edge that peeks out while collapsed: the front card's
              // size, drawn only, with nothing to read.
              <Box
                data-testid={"roll-stack-peek"}
                sx={(theme) => ({
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: frontHeight,
                  borderRadius: `${theme.shape.borderRadius}px`,
                  bgcolor: depth === 1 ? "grey.700" : "grey.600",
                  boxShadow: theme.shadows[2],
                  opacity: isExpanded ? 0 : 1,
                  transition: fadeTransition(theme),
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                })}
              />
            )}
            <Box
              sx={(theme) => ({
                position: "relative",
                opacity: isHidden ? 0 : 1,
                pointerEvents: isHidden ? "none" : undefined,
                transition: fadeTransition(theme),
                "@media (prefers-reduced-motion: reduce)": {
                  transition: "none",
                },
              })}
            >
              <RollSnackbar
                roll={roll}
                rollId={id}
                isExpanded
                clampContent
                cardSx={{ width: "100%" }}
                onDismiss={() => onDismiss(roll.id)}
                dismissButtonRef={getDismissButtonRef(roll.id)}
                actions={
                  gameId && id && <NormalRollActions rollId={id} roll={roll} />
                }
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function fadeTransition(theme: Theme) {
  return theme.transitions.create("opacity", {
    duration: theme.transitions.duration.shorter,
    easing: theme.transitions.easing.easeOut,
  });
}

// Each card's layout height (unaffected by its transform), kept current as
// cards grow (Show all) or change.
function useCardHeights() {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const elements = useRef(new Map<string, HTMLElement>());
  const observer = useRef<ResizeObserver | null>(null);
  const refs = useRef(new Map<string, (element: HTMLElement | null) => void>());

  const measure = useCallback((targets: HTMLElement[]) => {
    setHeights((previous) => {
      let next = previous;
      targets.forEach((target) => {
        const key = target.dataset.rollKey;
        if (!key || previous[key] === target.offsetHeight) return;
        if (next === previous) next = { ...previous };
        next[key] = target.offsetHeight;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const resizeObserver = new ResizeObserver((entries) =>
      measure(entries.map((entry) => entry.target as HTMLElement)),
    );
    observer.current = resizeObserver;
    elements.current.forEach((element) => resizeObserver.observe(element));
    return () => {
      resizeObserver.disconnect();
      observer.current = null;
    };
  }, [measure]);

  const getRef = useCallback((rollKey: string) => {
    let ref = refs.current.get(rollKey);
    if (!ref) {
      ref = (element: HTMLElement | null) => {
        const previous = elements.current.get(rollKey);
        if (previous) observer.current?.unobserve(previous);
        if (element) {
          elements.current.set(rollKey, element);
          observer.current?.observe(element);
        } else {
          elements.current.delete(rollKey);
          refs.current.delete(rollKey);
        }
      };
      refs.current.set(rollKey, ref);
    }
    return ref;
  }, []);

  return { heights, getRef };
}
