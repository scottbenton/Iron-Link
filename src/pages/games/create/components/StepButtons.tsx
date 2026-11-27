import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import { HStack } from "ui/primitives";

export interface StepButtonsProps {
  canGoBack: boolean;
  onBack: () => void;
  isLastStep: boolean;
  /** The last step's submit label, such as "Create Game". */
  actionLabel?: string;
  /** The last step's label while it is creating, such as "Creating Game". */
  loadingLabel?: string;
  creating: boolean;
}

/** Back, then Next or the last step's submit. Both submit the step's form. */
export function StepButtons(props: StepButtonsProps) {
  const { canGoBack, onBack, isLastStep, actionLabel, loadingLabel, creating } =
    props;
  const { t } = useTranslation();

  return (
    <HStack justifyContent="space-between" gap="2">
      <Button variant="outline" disabled={!canGoBack} onClick={onBack}>
        {t("common.back", "Back")}
      </Button>
      {isLastStep ? (
        <Button
          type="submit"
          variant="gradient"
          loading={creating}
          loadingLabel={loadingLabel}
        >
          {actionLabel ?? t("game.create.start-game", "Start Game")}
        </Button>
      ) : (
        <Button type="submit" variant="primary">
          {t("common.next", "Next")}
        </Button>
      )}
    </HStack>
  );
}
