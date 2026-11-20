import { createContext } from "react";

import { AvatarSize } from "./Avatar";

export const SizeContext = createContext<AvatarSize | undefined>(undefined);
