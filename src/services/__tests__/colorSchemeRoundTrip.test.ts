import { describe, expect, it } from "vitest";

import { CharacterService } from "services/character.service";
import { GameService } from "services/game.service";

import { ColorScheme } from "repositories/shared.types";

/**
 * Every ColorScheme a user can pick must survive the DTO -> model conversion.
 *
 * Regression guard: the game path used to be a hand-written if/else chain
 * listing each member. Adding a scheme to the enum without touching that chain
 * compiled cleanly, but the new scheme was silently dropped on read and the
 * game reverted to the default on the next load.
 */

type PrivateConverter<T> = (dto: Record<string, unknown>) => T;

const convertGame = (
  GameService as unknown as {
    convertGameDTOToGame: PrivateConverter<{ colorScheme: ColorScheme | null }>;
  }
).convertGameDTOToGame;

const convertCharacter = (
  CharacterService as unknown as {
    convertCharacterDTOToCharacter: PrivateConverter<{
      colorScheme: ColorScheme | null;
    }>;
  }
).convertCharacterDTOToCharacter;

const gameDTO = (colorScheme: string | null) => ({
  id: "game-1",
  name: "Test Game",
  game_type: "solo",
  color_scheme: colorScheme,
  condition_meter_values: {},
  special_track_values: {},
});

const characterDTO = (colorScheme: string | null) => ({
  id: "character-1",
  name: "Test Character",
  color_scheme: colorScheme,
  stats: {},
  condition_meters: {},
  special_tracks: {},
  debilities: {},
});

describe("color scheme round trip", () => {
  describe.each([
    ["GameService", convertGame, gameDTO],
    ["CharacterService", convertCharacter, characterDTO],
  ] as const)("%s", (_name, convert, makeDTO) => {
    it.each(Object.values(ColorScheme))(
      "preserves %s rather than dropping it",
      (scheme) => {
        expect(convert(makeDTO(scheme)).colorScheme).toBe(scheme);
      },
    );

    it("returns null for an unrecognised stored value", () => {
      expect(convert(makeDTO("not-a-real-scheme")).colorScheme).toBeNull();
    });

    it("returns null when no scheme is stored", () => {
      expect(convert(makeDTO(null)).colorScheme).toBeNull();
    });
  });
});
