import CheckedIcon from "@mui/icons-material/CheckCircle";
import {
  Box,
  Card,
  CardActionArea,
  CardActionAreaProps,
  CardProps,
} from "@mui/material";

interface RadioCardProps extends CardProps {
  checked: boolean;
  onCheck: () => void;
  actionAreaProps: Omit<CardActionAreaProps, "onClick" | "children">;
}

export function RadioCard(props: RadioCardProps) {
  const { checked, onCheck, children, actionAreaProps, ...cardProps } = props;

  return (
    <Card
      {...cardProps}
      variant="outlined"
      sx={[
        (theme) => ({
          position: "relative",
          borderColor: checked
            ? theme.palette.primary.main
            : theme.palette.divider,
        }),
        ...(Array.isArray(cardProps.sx) ? cardProps.sx : [cardProps.sx]),
      ]}
    >
      <CardActionArea
        onClick={() => (checked ? undefined : onCheck())}
        {...actionAreaProps}
      >
        <Box width={24} height={24} sx={{ float: "right" }} ml={1} mb={1}>
          {checked && <CheckedIcon color="primary" />}
        </Box>
        {children}
      </CardActionArea>
    </Card>
  );
}
