import { Box } from "@mui/material";
import { PropsWithChildren, ReactNode } from "react";

export interface ActionToolbarProps extends PropsWithChildren {
  breadcrumbs: ReactNode;
}

// Breadcrumbs above a grey strip of item actions. Notes folders, notes, and
// linked worlds share it so every Notes tab has the same chrome.
export function ActionToolbar(props: ActionToolbarProps) {
  const { breadcrumbs, children } = props;

  return (
    <Box
      bgcolor="background.paper"
      zIndex={(theme) => theme.zIndex.appBar - 1}
      maxWidth={"100%"}
      borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
      pb={children ? 0 : 2}
    >
      <Box>{breadcrumbs}</Box>
      {children && (
        <Box mt={0.5} pb={1} overflow="hidden">
          <Box
            px={1}
            pr={0.5}
            py={0.5}
            bgcolor={(theme) =>
              theme.palette.grey[theme.palette.mode === "light" ? "200" : "800"]
            }
            borderRadius={1}
            display={"flex"}
            alignItems={"center"}
            gap={0.5}
            width={"100%"}
            sx={{ overflowX: "auto" }}
          >
            {children}
          </Box>
        </Box>
      )}
    </Box>
  );
}
