import { Card } from "ui/components/Card";
import { Text } from "ui/components/Text";
import { Icon, PhosphorIcon } from "ui/icons";
import { Box, HStack } from "ui/primitives";

export interface GroupPlayCalloutProps {
  icon: PhosphorIcon;
  title: string;
  description: string;
}

export function GroupPlayCallout(props: GroupPlayCalloutProps) {
  const { icon, title, description } = props;

  return (
    <Card padding="sm">
      <HStack gap="3">
        <Icon icon={icon} size="lg" color="accent" />
        <Box>
          <Text variant="bodySm" weight="semibold">
            {title}
          </Text>
          <Text variant="caption" as="p" color="muted">
            {description}
          </Text>
        </Box>
      </HStack>
    </Card>
  );
}
