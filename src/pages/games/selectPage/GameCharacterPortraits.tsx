import { Box, Typography } from "@mui/material";

import {
  AVATAR_SIZES,
  PortraitAvatar,
} from "components/characters/PortraitAvatar";

import { useUID } from "stores/auth.store";
import { GameCharacterDisplayDetails } from "stores/users.games.store";

export interface GameCharacterPortraitsProps {
  gameCharacterDetails: Record<string, GameCharacterDisplayDetails>;
}

export function GameCharacterPortraits(props: GameCharacterPortraitsProps) {
  const { gameCharacterDetails } = props;

  const uid = useUID();

  // Sort users from the current player to the front, then as they were
  const sortedCampaignCharacters = Object.entries(gameCharacterDetails).sort(
    ([, a], [, b]) => {
      if (a.uid !== b.uid) {
        if (a.uid === uid) {
          return -1;
        }
        if (b.uid === uid) {
          return 1;
        }
      }
      return a.name.localeCompare(b.name);
    },
  );

  if (sortedCampaignCharacters.length === 0) {
    return null;
  }
  if (sortedCampaignCharacters.length === 1) {
    return (
      <PortraitAvatar
        characterId={sortedCampaignCharacters[0][0]}
        portraitSettings={
          sortedCampaignCharacters[0][1].profileImageSettings ?? undefined
        }
        name={sortedCampaignCharacters[0][1].name}
        size={"large"}
        borderWidth={1}
      />
    );
  }
  if (sortedCampaignCharacters.length === 2) {
    return (
      <Box
        position={"relative"}
        width={AVATAR_SIZES.large}
        height={AVATAR_SIZES.large}
      >
        <PortraitAvatar
          characterId={sortedCampaignCharacters[1][0]}
          portraitSettings={
            sortedCampaignCharacters[1][1].profileImageSettings ?? undefined
          }
          name={sortedCampaignCharacters[1][1].name}
          borderWidth={1}
        />
        <PortraitAvatar
          characterId={sortedCampaignCharacters[0][0]}
          portraitSettings={
            sortedCampaignCharacters[0][1].profileImageSettings ?? undefined
          }
          name={sortedCampaignCharacters[0][1].name}
          borderWidth={1}
          sx={{ position: "absolute", bottom: 0, right: 0 }}
        />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      gap={-1}
      flexWrap="wrap"
      width={AVATAR_SIZES.large}
      height={AVATAR_SIZES.large}
      alignItems={"center"}
      justifyContent={"center"}
    >
      {sortedCampaignCharacters
        .slice(0, 3)
        .map(([characterId, characterDetails]) => (
          <PortraitAvatar
            key={characterId}
            characterId={characterId}
            portraitSettings={
              characterDetails.profileImageSettings ?? undefined
            }
            name={characterDetails.name}
            size={"small"}
            borderWidth={1}
          />
        ))}
      {sortedCampaignCharacters.length === 4 && (
        <PortraitAvatar
          characterId={sortedCampaignCharacters[3][0]}
          portraitSettings={
            sortedCampaignCharacters[3][1].profileImageSettings ?? undefined
          }
          name={sortedCampaignCharacters[3][1].name}
          size="small"
          borderWidth={1}
        />
      )}
      {sortedCampaignCharacters.length > 4 && (
        <Box
          bgcolor="background.default"
          borderRadius={1}
          border={(theme) => `1px solid ${theme.palette.divider}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          width={AVATAR_SIZES.small}
          height={AVATAR_SIZES.small}
        >
          <Typography fontWeight={600} color="textSecondary">
            +{sortedCampaignCharacters.length - 3}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
