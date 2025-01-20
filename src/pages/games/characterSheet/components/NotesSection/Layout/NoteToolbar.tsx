import { Box } from "@mui/material";
import { PropsWithChildren } from "react";

import { useIsMobile } from "hooks/useIsMobile";

import { NoteBreadcrumbs } from "./NoteBreadcrumbs";

export function NoteToolbar(props: PropsWithChildren) {
  const { children } = props;

  const isMobile = useIsMobile();

  return (
    <Box
      position={isMobile ? "sticky" : undefined}
      top={0}
      bgcolor="background.paper"
      zIndex={(theme) => theme.zIndex.appBar - 1}
      maxWidth={"100%"}
      borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
      pb={children ? 0 : 2}
    >
      <Box>
        <NoteBreadcrumbs />
      </Box>
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
