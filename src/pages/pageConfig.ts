export const pageConfig = {
  home: "/",
  gameSelect: "/games",
  gameCreate: "/games/create",
  game: (gameId: string) => `/games/${gameId}`,
  gameCharacter: (gameId: string, characterId: string) =>
    `/games/${gameId}/c/${characterId}`,
  gameCharacterCreate: (gameId: string) => `/games/${gameId}/create`,
  gameJoin: (inviteKey: string) => `/join/${inviteKey}`,
  worldSelect: "/worlds",
  world: (worldId: string) => `/worlds/${worldId}`,
  homebrewSelect: "/homebrew",
  homebrew: (homebrewId: string) => `/homebrew/${homebrewId}`,
  auth: "/auth",
};
