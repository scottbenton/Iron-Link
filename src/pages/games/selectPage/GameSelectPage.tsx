import { GradientButton } from "components/GradientButton";
import { PageContent, PageHeader } from "components/Layout";
import { GridLayout } from "components/Layout/GridLayout";
import { pathConfig } from "pages/pathConfig";
import { useTranslation } from "react-i18next";
import { useUsersCampaigns } from "atoms/users.campaigns";
import { CampaignCard } from "./CampaignCard";

export function GameSelectPage() {
  const { t } = useTranslation();
  const campaignState = useUsersCampaigns();

  return (
    <>
      <PageHeader
        label={t("Your Games")}
        actions={
          <GradientButton href={pathConfig.gameCreate}>
            {t("Create Game")}
          </GradientButton>
        }
      />
      <PageContent>
        <GridLayout
          items={Object.entries(campaignState.campaigns)}
          renderItem={([campaignId, campaign]) => (
            <CampaignCard campaignId={campaignId} campaign={campaign} />
          )}
          loading={campaignState.loading}
          error={campaignState.error}
          emptyStateMessage={t("No games found")}
          emptyStateAction={
            <GradientButton href={pathConfig.gameCreate}>
              {t("Create Game")}
            </GradientButton>
          }
          minWidth={300}
        />
      </PageContent>
    </>
  );
}