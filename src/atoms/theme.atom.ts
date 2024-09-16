import { atom, useAtom } from "jotai";

export enum ColorScheme {
  Default = "default",
  Cinder = "cinder",
  Eidolon = "eidolon",
  Hinterlands = "hinterlands",
  Myriad = "myriad",
  Mystic = "mystic",
}

export const colorSchemeAtom = atom<ColorScheme>(ColorScheme.Default);

export function useColorScheme() {
  return useAtom(colorSchemeAtom);
}