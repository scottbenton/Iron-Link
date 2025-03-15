import { Card, Heading } from "@chakra-ui/react";
import { DicesIcon } from "lucide-react";
import { useId } from "react";

import { InnerStatButton } from "./InnerStatButton";

export interface StatProps {
  label: string;
  value: number;
  onActionClick?: () => void;
  action?: {
    ActionIcon: typeof DicesIcon;
    actionLabel: string;
  };
  disabled?: boolean;
}

export function Stat(props: StatProps) {
  const { label, value, onActionClick, action, disabled } = props;

  const id = useId();

  return (
    <Card.Root variant="outline" bg="bg.muted" flexShrink={0} minW={16}>
      <Card.Body alignItems={"stretch"} p={0}>
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
        <InnerStatButton
          id={id}
          value={value}
          onClick={onActionClick}
          action={action}
          disabled={disabled}
          px={1}
          pb={1}
        />
      </Card.Body>
    </Card.Root>
  );
}
