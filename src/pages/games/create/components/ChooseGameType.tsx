import { useTranslation } from "react-i18next";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { SectionHeading } from "components/SectionHeading";
import { CampaignType } from "api-calls/campaign/_campaign.type";
import { CampaignTypeIcon } from "assets/CampaignTypeIcon/CampaignTypeIcon";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { derivedAtomWithEquality } from "atoms/derivedAtomWithEquality";
import { createGameAtom, useSetCreateGameAtom } from "../atoms/createGame.atom";
import { useAtomValue } from "jotai";

const gameTypeAtom = derivedAtomWithEquality(
  createGameAtom,
  (state) => state.gameType
);

export function ChooseGameType() {
  const { t } = useTranslation();
  const gameType = useAtomValue(gameTypeAtom);
  const setCreateGame = useSetCreateGameAtom();

  const descriptions: Record<CampaignType, string> = {
    [CampaignType.Solo]: t("One player, playing one or more characters."),
    [CampaignType.Coop]: t("Two or more players, all playing characters."),
    [CampaignType.Guided]: t(
      "One player takes the role of guide, with the rest playing characters."
    ),
  };

  return (
    <Box>
      <SectionHeading breakContainer label={t("Choose Game Type")} />
      <Typography mt={1} color="text.secondary">
        {t(
          "How will you be playing your game? Game types help to streamline your experience."
        )}
      </Typography>
      <Box
        mt={2}
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))"
        gap={2}
      >
        {Object.values(CampaignType).map((type) => (
          <Card key={type} variant="outlined">
            <CardActionArea
              onClick={() =>
                setCreateGame((prev) => ({ ...prev, gameType: type }))
              }
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
              }}
            >
              <Box
                display="flex"
                alignItems="flex-start"
                justifyContent={"space-between"}
              >
                <Box display="flex" alignItems="center">
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    borderRadius={1}
                    p={1}
                    bgcolor="primary.main"
                    color="primary.contrastText"
                  >
                    <CampaignTypeIcon
                      sx={(theme) => ({
                        width: 32,
                        height: 32,
                        strokeWidth: 1,
                        overflow: "visible",
                        stroke: theme.palette.common.white,
                        color: theme.palette.common.white,
                      })}
                      campaignType={type}
                    />
                  </Box>
                  <Typography
                    variant="h5"
                    textTransform="uppercase"
                    fontFamily={"fontFamilyTitle"}
                    ml={2}
                  >
                    {t(type)}
                  </Typography>
                </Box>
                <Box width={24} height={24}>
                  {gameType === type && <CheckCircleIcon color="primary" />}
                </Box>
              </Box>
              <Typography mt={1} color="text.secondary">
                {descriptions[type]}
              </Typography>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}