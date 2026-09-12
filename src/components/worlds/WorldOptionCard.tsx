import { Card, CardActionArea, Typography } from "@mui/material";

import { WorldCreationOption } from "lib/worldSettings";

export interface WorldOptionCardProps {
  option: WorldCreationOption;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function WorldOptionCard(props: WorldOptionCardProps) {
  const { option, selected, disabled, onSelect } = props;

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        // The selection ring lives on the card, not on the action area inside
        // it: a border on the action area sits inside the card's own outline
        // as a second, square-cornered rectangle, and the hover highlight then
        // only covers the inner one. The inset shadow thickens the ring to 2px
        // without changing the border width, so selecting cannot shift layout.
        borderColor: selected ? theme.palette.primary.main : undefined,
        boxShadow: selected
          ? `inset 0 0 0 1px ${theme.palette.primary.main}`
          : undefined,
        // Clips the action area's hover highlight and ripple to the card's
        // rounded corners.
        overflow: "hidden",
      })}
    >
      <CardActionArea
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        sx={(theme) => ({
          height: "100%",
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          bgcolor: selected ? theme.palette.action.selected : undefined,
        })}
      >
        <Typography
          variant="h6"
          component="p"
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
          textTransform="uppercase"
          lineHeight={1.2}
        >
          {option.name}
        </Typography>
        {option.packageName && (
          <Typography color="text.secondary" variant="caption">
            {option.packageName}
          </Typography>
        )}
        {option.description && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            {option.description}
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
}
