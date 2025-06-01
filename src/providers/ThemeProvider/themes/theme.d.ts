// theme.d.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PaletteOptions } from "@mui/material";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TypographyOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypographyVariants {
    fontFamilyTitle?: string;
  }

  interface TypographyVariantsOptions {
    fontFamilyTitle?: string;
  }
}

declare module "@mui/material/styles" {
  interface Palette {
    cursed: Palette["primary"];
    gradients: {
      outline: string;
      icon: string[];
    };
  }

  interface PaletteOptions {
    cursed?: PaletteOptions["primary"];
    gradients: {
      outline: string;
      icon: string[];
    };
  }
}
