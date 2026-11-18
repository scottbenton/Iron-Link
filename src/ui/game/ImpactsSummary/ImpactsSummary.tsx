import { PencilSimpleIcon } from "@phosphor-icons/react";
import { ReactNode, useRef, useState } from "react";

import { css } from "styled-system/css";

import { Alert } from "../../components/Alert";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Chip } from "../../components/Chip";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogHeader,
} from "../../components/Dialog";
import { IconButton } from "../../components/IconButton";
import { ImpactGroup, ImpactsChecklist } from "../ImpactsChecklist";
import {
  ImpactsSummaryStrings,
  impactsSummaryWording,
} from "./impactsSummaryStrings";

const headStyles = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  minHeight: "40px",
  paddingInlineStart: "4",
  paddingInlineEnd: "1",
  paddingBlockStart: "1",
});

const labelStyles = css({
  fontSize: "sm",
  color: "fg.muted",
});

const bodyStyles = css({
  paddingInline: "4",
  paddingBlockEnd: "4",
  // Without an Edit button the head is shorter, so the body still clears it.
  "[data-read-only] > &": { paddingBlockStart: "1" },
});

const listStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5",
  margin: 0,
  padding: 0,
  listStyle: "none",
});

const noneStyles = css({
  margin: 0,
  fontSize: "md",
  color: "fg.muted",
});

const sentenceCase = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export interface ImpactsSummaryProps {
  /** Groups in rules order, such as `rules.impacts` from Datasworn. */
  groups: ImpactGroup[];
  /** Marked impacts by key. Keys the rules do not know are ignored. */
  value: Record<string, boolean | undefined>;
  /**
   * Saves one impact the moment its box is ticked, as the live sheet does.
   * Without it there is no Edit button, as for a character the viewer
   * cannot edit. If the promise rejects, the box goes back and the dialog
   * shows an error that stays until dismissed.
   */
  onImpactChange?: (key: string, marked: boolean) => void | Promise<unknown>;
  /** Picks the wording; `strings` overrides it. */
  wording?: "ironsworn" | "starforged";
  strings?: Partial<ImpactsSummaryStrings>;
  /**
   * Under the checklist in the dialog, from the marks it shows, such as
   * "Max momentum +8, reset 0".
   */
  dialogFooter?: (value: Record<string, boolean | undefined>) => ReactNode;
  className?: string;
}

/**
 * A character's marked impacts (debilities in Ironsworn), as the live sheet
 * shows them: a card listing what is marked, or None, and an Edit button
 * that opens the full checklist in a dialog. Each box saves as it is
 * ticked; Done (or Close, or Escape) only closes the dialog.
 */
export function ImpactsSummary(props: ImpactsSummaryProps) {
  const {
    groups,
    value,
    onImpactChange,
    wording = "starforged",
    strings: stringsProp,
    dialogFooter,
    className,
  } = props;
  const strings = { ...impactsSummaryWording[wording], ...stringsProp };

  const [open, setOpen] = useState(false);
  // Ticks still saving, shown at once; dropped when the save settles.
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const latestTick = useRef<Record<string, number>>({});
  // The impact whose save failed last. Stays until dismissed or reopened.
  const [failedKey, setFailedKey] = useState<string>();

  const shown = { ...value, ...pending };
  const impacts = groups.flatMap((group) => group.impacts);
  const marked = impacts.filter((impact) => shown[impact.key]);
  const failed = impacts.find((impact) => impact.key === failedKey);

  const settle = (key: string, tick: number) => {
    if (latestTick.current[key] !== tick) return false;
    setPending((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    return true;
  };

  const change = async (key: string, isMarked: boolean) => {
    if (!onImpactChange) return;
    const tick = (latestTick.current[key] ?? 0) + 1;
    latestTick.current[key] = tick;
    setPending((current) => ({ ...current, [key]: isMarked }));
    try {
      await onImpactChange(key, isMarked);
      if (settle(key, tick)) {
        setFailedKey((current) => (current === key ? undefined : current));
      }
    } catch {
      if (settle(key, tick)) setFailedKey(key);
    }
  };

  return (
    <>
      <Card padding="none" className={className}>
        {/* One child, so the card's own gap does not open between the two. */}
        <div data-read-only={onImpactChange ? undefined : ""}>
          <div className={headStyles}>
            <span className={labelStyles}>{strings.activeLabel}</span>
            {onImpactChange && (
              <IconButton
                label={strings.edit}
                size="sm"
                onClick={() => {
                  setFailedKey(undefined);
                  setOpen(true);
                }}
              >
                <PencilSimpleIcon />
              </IconButton>
            )}
          </div>
          <div className={bodyStyles}>
            {marked.length > 0 ? (
              <ul className={listStyles} aria-label={strings.activeLabel}>
                {marked.map((impact) => (
                  <li key={impact.key}>
                    <Chip variant="soft" tone="danger" size="sm">
                      {sentenceCase(impact.label)}
                    </Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={noneStyles}>{strings.none}</p>
            )}
          </div>
        </div>
      </Card>

      {onImpactChange && (
        <Dialog open={open} onClose={() => setOpen(false)} size="md">
          <DialogHeader title={strings.edit} />
          <DialogBody>
            {failed && (
              <Alert
                tone="danger"
                role="alert"
                onClose={() => setFailedKey(undefined)}
                closeLabel={strings.dismissError}
              >
                {strings.saveError(sentenceCase(failed.label))}
              </Alert>
            )}
            <ImpactsChecklist
              groups={groups}
              value={shown}
              onChange={change}
              wording={wording}
              hideTitle
              footer={dialogFooter?.(shown)}
            />
          </DialogBody>
          <DialogActions>
            <Button variant="primary" onClick={() => setOpen(false)}>
              {strings.done}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
