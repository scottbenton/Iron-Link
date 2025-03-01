import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface ListItemProps extends BoxProps {
  onClick?: () => void;
  label: string;
  description?: string;
  disabled?: boolean;
  secondaryAction?: ReactNode;
  icon?: ReactNode;
  id?: string;
}

export function ListItem(props: ListItemProps) {
  const {
    id,
    onClick,
    label,
    description,
    secondaryAction,
    icon,
    disabled,
    ...boxProps
  } = props;

  const Child = onClick ? "button" : "div";

  return (
    <Box as="li" position="relative" display="flex" {...boxProps}>
      <Box
        asChild
        display="flex"
        alignItems="center"
        pl={icon ? 3 : 4}
        pr={4}
        py={3}
        flexGrow={1}
        colorPalette="blackAlpha"
        borderRadius="sm"
        css={
          onClick
            ? {
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "bg.muted",
                },
              }
            : {}
        }
      >
        <Child disabled={disabled} onClick={onClick}>
          {icon}
          <Box
            display="flex"
            flexDirection="column"
            alignItems="flex-start"
            gap={1}
            ml={icon ? 2 : 0}
          >
            <Box id={id} lineHeight={1}>
              {label}
            </Box>
            {description && <Box color="fg.muted">{description}</Box>}
          </Box>
        </Child>
      </Box>
      {secondaryAction && (
        <Box
          position="absolute"
          top={0}
          right={4}
          bottom={0}
          display="flex"
          alignItems={"center"}
          justifyContent={"center"}
        >
          {secondaryAction}
        </Box>
      )}
    </Box>
  );
}
