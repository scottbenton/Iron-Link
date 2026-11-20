import { createContext } from "react";

export type Announce = (message: string) => void;

export const AnnouncerContext = createContext<Announce | null>(null);
