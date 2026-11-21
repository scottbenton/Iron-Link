import { css } from "styled-system/css";
import { visuallyHidden } from "styled-system/patterns";

import { ConditionMeter, MomentumMeter } from "../../game/ConditionMeter";
import { StatGrid } from "../../game/StatCard";
import { character, meterKeys } from "./playLayoutsShared";
import { PlaySheet } from "./usePlaySheet";

const statKeys = ["edge", "heart", "iron", "shadow", "wits"] as const;

const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Everything the character rolls, in one row: the five stats, then
 * Health, Spirit, Supply and Momentum, each at its own width, 6px apart
 * like the stat cards. They wrap to a second row when the column is
 * narrow; nothing stretches across, and everything in a line shares its
 * height.
 */
export function Rolls(props: { sheet: PlaySheet; touch?: boolean }) {
  const { sheet, touch } = props;
  const stepperSize = touch ? "touch" : undefined;
  return (
    <div className={rollsStyles}>
      <div className={rollRowStyles}>
        <section className={statsStyles} aria-labelledby="sheet-stats">
          <h3 id="sheet-stats" className={visuallyHidden()}>
            Stats
          </h3>
          <StatGrid
            stats={statKeys.map((key) => ({
              key,
              name: capitalize(key),
              value: character.stats[key],
            }))}
            adds={sheet.adds}
            onRoll={(stat) => sheet.roll(stat.name, stat.value)}
          />
        </section>
        <section className={meterRowStyles} aria-labelledby="sheet-meters">
          <h3 id="sheet-meters" className={visuallyHidden()}>
            Meters
          </h3>
          {meterKeys.map((meter) => (
            <ConditionMeter
              key={meter}
              label={capitalize(meter)}
              value={sheet.meters[meter]}
              max={5}
              warnAtMin
              adds={sheet.adds}
              stepperSize={stepperSize}
              onChange={(value) => sheet.setMeter(meter, value)}
              onRoll={() => sheet.roll(capitalize(meter), sheet.meters[meter])}
            />
          ))}
          <MomentumMeter
            value={sheet.meters.momentum}
            stepperSize={stepperSize}
            onChange={(value) => sheet.setMeter("momentum", value)}
            onBurn={() => sheet.setMeter("momentum", 2)}
          />
        </section>
      </div>
    </div>
  );
}

const rollsStyles = css({ display: "grid", gap: "3", minWidth: 0 });

// Every item in a line shares its height, so the stat cards and the meters
// line up top and bottom wherever the row wraps. 6px between the groups,
// as between the stat cards (StatGrid's --stat-gap) and the meters.
const rollRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "stretch",
  gap: "1.5",
  minWidth: 0,
});

/**
 * The stats at the width five cards need, never stretched across, but as
 * tall as the line: the cards fill it, their ledge inside it.
 */
const statsStyles = css({
  flex: "0 1 400px",
  minWidth: "min(100%, 300px)",
  display: "grid",
  paddingBottom: "var(--border-widths-ledge)",
  "& > div, & > div > ul": { height: "100%" },
});

const meterRowStyles = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5",
  minWidth: 0,
  "& > [role=group]": { flex: "none" },
});
