import { Box, BoxProps, Text } from "@chakra-ui/react";
import { ReactNode, useCallback, useState } from "react";

export interface ListItemProps extends Omit<BoxProps, "children"> {
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

  const [secondaryActionWidth, setSecondaryActionWidth] = useState(0);
  const secondaryActionRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      const { width } = node.getBoundingClientRect();
      setSecondaryActionWidth(width);
    }
  }, []);

  return (
    <Box as="li" position="relative" display="flex" {...boxProps}>
      <Box
        asChild
        display="flex"
        alignItems="center"
        pl={icon ? 3 : 4}
        pr={16 + secondaryActionWidth + "px"}
        py={3}
        flexGrow={1}
        colorPalette="blackAlpha"
        transition="backgrounds"
        transitionDuration="faster"
        transitionTimingFunction="ease-in-out"
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
            flexGrow={1}
            flexDirection="column"
            alignItems="flex-start"
            gap={1}
            ml={icon ? 2 : 0}
            textAlign={"left"}
          >
            <Text id={id} lineHeight={1}>
              {label}
            </Text>
            {description && <Box color="fg.muted">{description}</Box>}
          </Box>
        </Child>
      </Box>
      {secondaryAction && (
        <Box
          ref={secondaryActionRef}
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
