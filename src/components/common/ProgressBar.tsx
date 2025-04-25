import { useListenToAuth } from "@/stores/auth.store";
import { Progress, ProgressRootProps } from "@chakra-ui/react";

export function ProgressBar(props: ProgressRootProps) {
  useListenToAuth();

  return (
    <Progress.Root value={null} variant="subtle" size="xs" {...props}>
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
    </Progress.Root>
  );
}
