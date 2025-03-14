import { ColorPalette } from "@chakra-ui/react";
import { createContext } from "react";

export interface ConfirmParams {
  title: string;
  message: string;
  confirmText?: string;
  confirmColorPalette?: ColorPalette;
  cancelText?: string;
}

export interface ConfirmResult {
  confirmed: boolean;
}

export const ConfirmContext = createContext<{
  confirm: (id: string, confirm: ConfirmParams) => Promise<ConfirmResult>;
  close: (id: string) => void;
}>({
  confirm: async () => {
    return { confirmed: false };
  },
  close: () => {},
});
