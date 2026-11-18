import { css } from "styled-system/css";

import { Text } from "../../components/Text";

const swatchStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: "1.5",
  minWidth: 0,
});

const chipStyles = css({
  height: "56px",
  borderRadius: "md",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.subtle",
});

export interface SwatchProps {
  name: string;
  value: string;
  note?: string;
}

export function Swatch(props: SwatchProps) {
  const { name, value, note } = props;
  return (
    <div className={swatchStyles}>
      <div className={chipStyles} style={{ background: value }} />
      <div>
        <Text variant="bodySm" weight="medium" as="code" truncate>
          {name}
        </Text>
        {note && (
          <Text variant="caption" color="muted" as="p">
            {note}
          </Text>
        )}
      </div>
    </div>
  );
}
