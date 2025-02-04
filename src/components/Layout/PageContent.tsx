import { Breakpoint, Container, Paper, SxProps, Theme } from "@mui/material";
import { PropsWithChildren } from "react";

export interface PageContentProps extends PropsWithChildren {
  isPaper?: boolean;
  viewHeight?: "min-full" | "max-full";
  hiddenHeader?: boolean;
  maxWidth?: false | Breakpoint;
  sx?: SxProps<Theme>;
  disablePadding?: boolean;
}

export function PageContent(props: PageContentProps) {
  const {
    children,
    isPaper,
    viewHeight,
    hiddenHeader,
    maxWidth,
    sx,
    disablePadding,
  } = props;

  return (
    <Container
      component={isPaper ? Paper : "div"}
      maxWidth={maxWidth ?? "xl"}
      sx={[
        (theme) => ({
          bgcolor: "background.paper",
          // position: "relative",
          borderRadius: isPaper ? `${theme.shape.borderRadius}px` : 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          flexGrow: 1,

          pb: disablePadding ? 0 : 2,
          display: "flex",
          flexDirection: "column",
        }),
        viewHeight
          ? (theme) => ({
              [theme.breakpoints.up("md")]: {
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                maxHeight: viewHeight === "max-full" ? "100vh" : undefined,
              },
              mt: hiddenHeader ? -4 : 0,
              borderRadius: hiddenHeader ? 0 : undefined,
            })
          : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      disableGutters={disablePadding}
    >
      {children}
    </Container>
  );
}
