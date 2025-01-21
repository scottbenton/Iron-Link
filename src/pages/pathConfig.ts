export const pathConfig = {
  home: "/",
  gameSelect: "/games",
  gameCreate: "/games/create",
  game: (gameId: string) => `/games/${gameId}`,
  gameCharacter: (gameId: string, characterId: string) =>
    `/games/${gameId}/c/${characterId}`,
  gameCharacterCreate: (gameId: string) => `/games/${gameId}/create`,
  gameJoin: (gameId: string) => `/games/${gameId}/join`,
  worldSelect: "/worlds",
  world: (worldId: string) => `/worlds/${worldId}`,
  homebrewSelect: "/homebrew",
  homebrew: (homebrewId: string) => `/homebrew/${homebrewId}`,
  auth: "/auth",
};

// Can be accessed regardless of authentication status
export const openPaths = [
  pathConfig.auth,
  pathConfig.home,
  // Homebrew editor
];

// Cannot be accessed while logged in
export const onlyUnauthenticatedPaths = [pathConfig.auth];
