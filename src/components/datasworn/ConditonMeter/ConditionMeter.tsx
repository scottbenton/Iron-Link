import { useDataswornTranslations } from "@/hooks/i18n/useDataswornTranslations";
import {
  Box,
  Card,
  CardRootProps,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

import { InnerStatButton } from "../Stat/InnerStatButton";

export interface ConditionMeterProps extends Omit<CardRootProps, "onChange"> {
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
    ...cardRootProps
  } = props;

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
      {...cardRootProps}
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
          <InnerStatButton
            id={id}
            value={currentValue}
            onClick={onActionClick}
            action={action}
            disabled={disabled}
          />
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
  );
}
