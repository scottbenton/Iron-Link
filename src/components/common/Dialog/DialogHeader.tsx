import {
  Box,
  DialogHeader as CHDialogHeader,
  DialogHeaderProps as CHDialogHeaderProps,
  DialogCloseTrigger,
  DialogTitle,
  IconButton,
} from "@chakra-ui/react";
import { XIcon } from "lucide-react";
import { ReactNode } from "react";

import { LiveRegion } from "../LiveRegion";

export interface DialogHeaderProps extends CHDialogHeaderProps {
  actions?: ReactNode;
}

export function DialogHeader(props: DialogHeaderProps) {
  const { actions, children, ...headerProps } = props;

  return (
    <CHDialogHeader
      display="flex"
      alignItems="center"
      justifyContent={"space-between"}
      pt={4}
      pr={4}
      {...headerProps}
    >
      <LiveRegion />

      {typeof children === "string" ? (
        <DialogTitle>{children}</DialogTitle>
      ) : (
        children
      )}

      <Box display="flex" alignItems={"center"}>
        {actions}
        <DialogCloseTrigger asChild colorPalette={"gray"} position="initial">
          <IconButton variant="ghost">
            <XIcon />
          </IconButton>
        </DialogCloseTrigger>
      </Box>
    </CHDialogHeader>
  );
}
