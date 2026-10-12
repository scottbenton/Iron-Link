import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  Card,
  CardActionArea,
  Typography,
  type TypographyProps,
} from "@mui/material";
import {
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
  type Ref,
  useId,
} from "react";

// What a RadioCardGroup hands each card so the group can manage selection and
// focus. Spread it onto a RadioCard.
export interface RadioCardControlProps {
  ref: Ref<HTMLButtonElement>;
  selected: boolean;
  // Roving focus: only one card in the group is reached with Tab.
  focusable: boolean;
  disabled: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export type RadioCardProps = PropsWithChildren<
  RadioCardControlProps & {
    title: ReactNode;
    // Shown before the title, such as an icon tile.
    icon?: ReactNode;
    description?: ReactNode;
    titleVariant?: TypographyProps["variant"];
    descriptionVariant?: TypographyProps["variant"];
    // Ids of further text describing the card, such as why it is disabled.
    describedBy?: string[];
    // Rendered below the selectable area, so it may hold its own buttons.
    footer?: ReactNode;
  }
>;

// One option of a RadioCardGroup. The selection ring lives on the card, and a
// check mark appears in a slot that is always reserved, so selecting never
// shifts layout.
export function RadioCard({
  ref,
  selected,
  focusable,
  disabled,
  onSelect,
  onKeyDown,
  title,
  icon,
  description,
  titleVariant = "h6",
  descriptionVariant = "body2",
  describedBy = [],
  footer,
  children,
}: RadioCardProps) {
  const titleId = useId();
  const descriptionId = useId();
  const describedByIds = [
    ...(description ? [descriptionId] : []),
    ...describedBy,
  ];
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // A border on the action area would sit inside the card's outline as a
        // second, square-cornered rectangle. The inset shadow thickens the
        // ring to 2px without changing the border width.
        borderColor: selected ? theme.palette.primary.main : undefined,
        boxShadow: selected
          ? `inset 0 0 0 1px ${theme.palette.primary.main}`
          : undefined,
        // Clips the action area's hover highlight and ripple to the corners.
        overflow: "hidden",
      })}
    >
      <CardActionArea
        ref={ref}
        role="radio"
        aria-checked={selected}
        aria-labelledby={titleId}
        aria-describedby={
          describedByIds.length ? describedByIds.join(" ") : undefined
        }
        tabIndex={focusable ? 0 : -1}
        disabled={disabled}
        onClick={onSelect}
        onKeyDown={onKeyDown}
        sx={(theme) => ({
          flexGrow: 1,
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "flex-start",
          bgcolor: selected ? theme.palette.action.selected : undefined,
          "&.Mui-focusVisible": {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: -2,
          },
        })}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            {icon}
            <Typography
              id={titleId}
              variant={titleVariant}
              component="p"
              fontFamily={(theme) => theme.typography.fontFamilyTitle}
              textTransform="uppercase"
              lineHeight={1.2}
            >
              {title}
            </Typography>
          </Box>
          <Box
            data-testid="radio-card-check"
            sx={{ width: 24, height: 24, flexShrink: 0 }}
          >
            {selected && <CheckCircleIcon color="primary" aria-hidden />}
          </Box>
        </Box>
        {description && (
          <Typography
            id={descriptionId}
            component="div"
            variant={descriptionVariant}
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {description}
          </Typography>
        )}
        {children}
      </CardActionArea>
      {footer}
    </Card>
  );
}
