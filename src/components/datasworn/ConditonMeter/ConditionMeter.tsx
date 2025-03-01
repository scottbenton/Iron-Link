import { GradientBox } from "@/components/common/GradientBox";
import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import { Box, Card, Heading, Icon, IconButton } from "@chakra-ui/react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

export interface ConditionMeterProps {
  label: string;
  defaultValue: number;
  value?: number;
  min: number;
  max: number;
  onChange?: (value: number) => void;
  onActionClick?: () => void;
  action?: {
    ActionIcon: typeof PlusIcon;
    actionLabel: string;
  };
  disabled?: boolean;
}

const normalPx = 3;
const normalPy = 2;
const normalBorderRadius = "sm";
const borderSize = 1;

export function ConditionMeter(props: ConditionMeterProps) {
  const {
    label,
    defaultValue,
    value,
    min,
    max,
    onChange,
    onActionClick,
    action,
    disabled,
  } = props;
  const { ActionIcon, actionLabel } = action ?? {};

  const t = useDataswornTranslations();

  const currentValue = value ?? defaultValue;

  const id = useId();

  return (
    <Card.Root
      variant="outline"
      minW={20}
      bg="bg.muted"
      size="sm"
      flexShrink={0}
    >
      <Card.Body alignItems="stretch" p={0}>
        <Heading
          asChild
          textAlign="center"
          color="fg.muted"
          textTransform="uppercase"
          py={0.5}
          size="sm"
        >
          <label htmlFor={id}>{label}</label>
        </Heading>
        <Box display="flex" alignItems="center" px={onChange ? 0 : 1} pb={1}>
          <IconButton
            colorPalette={"gray"}
            variant="subtle"
            aria-label={t("meter-subtract-1", "subtract 1 from {{label}}", {
              label,
            })}
            disabled={!onChange || currentValue <= min || disabled}
            onClick={() => onChange && onChange(currentValue - 1)}
          >
            <MinusIcon />
          </IconButton>
          <Box
            id={id}
            as={onActionClick && !disabled ? "button" : "div"}
            data-testid={onActionClick && !disabled ? "roll-button" : undefined}
            onClick={onActionClick}
            {...(onActionClick && !disabled ? { focusRipple: true } : {})}
            display="block"
            borderRadius={normalBorderRadius}
            overflow="hidden"
            flexGrow={1}
            css={
              onActionClick && !disabled
                ? {
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
          >
            <GradientBox
              className="gradient-box"
              transitionProperty="padding"
              transitionDuration="fast"
              transitionTimingFunction="linear"
              p={0}
              _before={{
                opacity: 0,
              }}
            >
              <Box
                className="inner-box"
                transitionProperty="padding"
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
                    color="fg.muted"
                    mr={1}
                    ml={-1}
                    aria-label={actionLabel}
                  >
                    <ActionIcon />
                  </Icon>
                )}
                <Heading as="span" size="xl" w={6} textAlign="center">
                  {currentValue >= 0 ? "+" : "-"}
                  {currentValue}
                </Heading>
              </Box>
              {/* <Box
              className="inner-box"
              px={normalPx}
              py={normalPy}
              display="flex"
              alignItems="center"
              bgcolor={(theme) =>
                theme.palette.mode === "light" ? "grey.700" : "grey.900"
              }
              justifyContent="center"
            >
              {ActionIcon && (
                <ActionIcon
                  data-testid={label + actionLabel}
                  aria-label={actionLabel}
                  color={"inherit"}
                  fontSize={"small"}
                  sx={{
                    ml: -0.5,
                    mr: 0.5,
                    color: "grey.300",
                  }}
                />
              )}
              <Typography
                variant="h5"
                fontFamily={(theme) => theme.typography.fontFamilyTitle}
                sx={{ width: 24 }}
              >
                {currentValue >= 0 ? "+" : "-"}
                {currentValue}
              </Typography>
            </Box> */}
            </GradientBox>
          </Box>
          <IconButton
            colorPalette={"gray"}
            variant="subtle"
            aria-label={t("meter-add-1", "add 1 to {{label}}", {
              label,
            })}
            disabled={!onChange || currentValue >= max || disabled}
            onClick={() => onChange && onChange(currentValue + 1)}
          >
            <PlusIcon />
          </IconButton>
        </Box>
      </Card.Body>
    </Card.Root>

    //   <Box display="flex" alignItems="center" px={onChange ? 0 : 0.5} pb={0.5}>
    //     <IconButton
    //       aria-label={t(
    //         "datasworn.meter-subtract-1",
    //         "subtract 1 from {{label}}",
    //         { label },
    //       )}
    //       size={"small"}
    //       disabled={!onChange || currentValue <= min || disabled}
    //       onClick={() => onChange && onChange(currentValue - 1)}
    //     >
    //       <MinusIcon />
    //     </IconButton>
    //     <Box
    //       id={id}
    //       component={onActionClick && !disabled ? ButtonBase : "div"}
    //       data-testid={onActionClick && !disabled ? "roll-button" : undefined}
    //       onClick={onActionClick}
    //       {...(onActionClick && !disabled ? { focusRipple: true } : {})}
    //       display="block"
    //       color="common.white"
    //       borderRadius={normalBorderRadius}
    //       overflow="hidden"
    //       flexGrow={1}
    //       sx={[
    //         (theme) => ({
    //           ".MuiTouchRipple-root": {
    //             zIndex: 3,
    //           },
    //           "& .gradient-box": {
    //             transition: theme.transitions.create(["padding"], {
    //               duration: theme.transitions.duration.short,
    //               easing: theme.transitions.easing.easeInOut,
    //             }),
    //             p: 0,
    //             "&::before": {
    //               opacity: 0,
    //             },
    //           },
    //           "& .inner-box": {
    //             transition: theme.transitions.create(["padding"], {
    //               duration: theme.transitions.duration.short,
    //               easing: theme.transitions.easing.easeInOut,
    //             }),
    //           },
    //         }),
    //         onActionClick && !disabled
    //           ? {
    //               "&:hover, &:focus-visible": {
    //                 "& .gradient-box": {
    //                   p: borderSize,
    //                   "&::before": {
    //                     opacity: 1,
    //                   },
    //                 },
    //                 "& .inner-box": {
    //                   px: normalPx - borderSize,
    //                   py: normalPy - borderSize,
    //                   borderRadius: normalBorderRadius - borderSize,
    //                 },
    //               },
    //             }
    //           : {},
    //       ]}
    //     >
    //       <GradientBox className="gradient-box">
    //         <Box
    //           className="inner-box"
    //           px={normalPx}
    //           py={normalPy}
    //           display="flex"
    //           alignItems="center"
    //           bgcolor={(theme) =>
    //             theme.palette.mode === "light" ? "grey.700" : "grey.900"
    //           }
    //           justifyContent="center"
    //         >
    //           {ActionIcon && (
    //             <ActionIcon
    //               data-testid={label + actionLabel}
    //               aria-label={actionLabel}
    //               color={"inherit"}
    //               fontSize={"small"}
    //               sx={{
    //                 ml: -0.5,
    //                 mr: 0.5,
    //                 color: "grey.300",
    //               }}
    //             />
    //           )}
    //           <Typography
    //             variant="h5"
    //             fontFamily={(theme) => theme.typography.fontFamilyTitle}
    //             sx={{ width: 24 }}
    //           >
    //             {currentValue >= 0 ? "+" : "-"}
    //             {currentValue}
    //           </Typography>
    //         </Box>
    //       </GradientBox>
    //     </Box>
    //     <IconButton
    //       aria-label={t("datasworn.meter-add-1", "add 1 to {{label}}", {
    //         label,
    //       })}
    //       size={"small"}
    //       disabled={!onChange || currentValue >= max || disabled}
    //       onClick={() => onChange && onChange(currentValue + 1)}
    //     >
    //       <PlusIcon />
    //     </IconButton>
    //   </Box>
    // </Card.Root>
  );
}
