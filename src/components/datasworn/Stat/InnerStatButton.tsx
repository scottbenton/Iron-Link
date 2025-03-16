import { GradientBox } from "@/components/common/GradientBox";
import { Box, BoxProps, Heading, Icon } from "@chakra-ui/react";
import { DicesIcon } from "lucide-react";

const normalPx = 3;
const normalPy = 1;
const normalBorderRadius = "sm";
const borderSize = 1;

export interface InnerStatButtonProps extends Omit<BoxProps, "onClick"> {
  id: string;
  onClick?: () => void;
  disabled?: boolean;
  action?: {
    ActionIcon: typeof DicesIcon;
    actionLabel: string;
  };
  value: number;
}

export function InnerStatButton(props: InnerStatButtonProps) {
  const { id, value, onClick, disabled, action, ...boxProps } = props;
  const { ActionIcon, actionLabel } = action ?? {};

  return (
    <Box
      id={id}
      as={onClick && !disabled ? "button" : "div"}
      data-testid={onClick && !disabled ? "roll-button" : undefined}
      onClick={onClick}
      {...(onClick && !disabled ? { focusRipple: true } : {})}
      display="block"
      borderRadius={normalBorderRadius}
      overflow="hidden"
      flexGrow={1}
      css={
        onClick && !disabled
          ? {
              cursor: "pointer",
              "&:hover": {
                "& .gradient-box": {
                  p: borderSize,
                  "&::before": {
                    opacity: 1,
                  },
                },
                "& .inner-box": {
                  px: normalPx - borderSize,
                  py: normalPy - borderSize,
                  borderRadius: "xs",
                },
              },
            }
          : undefined
      }
      {...boxProps}
    >
      <GradientBox
        className="gradient-box"
        transitionProperty="padding"
        transitionDuration="fast"
        transitionTimingFunction="linear"
        p={0}
        borderRadius="sm"
        _before={{
          transitionProperty: "opacity",
          transitionDuration: "fast",
          transitionTimingFunction: "linear",
          opacity: 0,
        }}
      >
        <Box
          className="inner-box"
          transitionProperty="padding border-radius"
          transitionDuration="fast"
          transitionTimingFunction="linear"
          px={normalPx}
          py={normalPy}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="bg.inverted"
          color="fg.inverted"
          borderRadius={"sm"}
          _dark={{
            bg: "bg.subtle",
            color: "fg",
          }}
        >
          {ActionIcon && (
            <Icon
              asChild
              size="sm"
              color="gray.300"
              mr={1}
              ml={-1}
              aria-label={actionLabel}
            >
              <ActionIcon />
            </Icon>
          )}
          <Heading as="span" size="xl" w={6} textAlign="center">
            {value >= 0 ? "+" : "-"}
            {value}
          </Heading>
        </Box>
      </GradientBox>
    </Box>
  );
}
