import { useListenToAuth } from "@/stores/auth.store";
import { Progress } from "@chakra-ui/react";

export function ProgressBar() {
  useListenToAuth();

  return (
    <Progress.Root value={null} variant="subtle" size="xs">
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
    </Progress.Root>
  );
}
