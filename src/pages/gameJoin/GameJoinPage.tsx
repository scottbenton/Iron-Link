import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { Button } from "ui/components/Button";
import { Progress } from "ui/components/Progress";
import { LinkBreakIcon } from "ui/icons";
import { EmptyState, PageContent, PageHeader } from "ui/layout";

import { useDocumentTitle } from "hooks/useDocumentTitle";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useUID } from "stores/auth.store";

import { useGameInvite } from "./hooks/useGameInvite";

export default function GameJoinPage() {
  const inviteKey = useParams<{ inviteKey: string }>().inviteKey;
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.GameJoin);

  const uid = useUID();
  const { gameName, loading, error, join } = useGameInvite(inviteKey, uid);

  useDocumentTitle(
    gameName ? t("game.join-name", "Join {{gameName}}", { gameName }) : null,
  );

  if (error) {
    return (
      <PageContent maxWidth="md">
        <EmptyState icon={<LinkBreakIcon />} message={error} />
      </PageContent>
    );
  }
  if (loading || !gameName) {
    return <Progress label={t("game.join-loading", "Loading invite")} />;
  }

  return (
    <>
      <PageHeader
        maxWidth="md"
        title={t("game.join-name", "Join {{gameName}}", { gameName })}
      />
      <PageContent maxWidth="md">
        <div>
          <Button variant="gradient" onClick={join}>
            {t("game.join", "Join")}
          </Button>
        </div>
      </PageContent>
    </>
  );
}
