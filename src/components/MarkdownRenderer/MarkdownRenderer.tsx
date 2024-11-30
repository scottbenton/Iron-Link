import { Datasworn, IdParser } from "@datasworn/core";
import {
  Box,
  Link,
  Stack,
  SxProps,
  Theme,
  Typography,
  TypographyProps,
  useTheme,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useOpenDataswornDialog } from "atoms/dataswornDialog.atom";

import { idMap } from "data/idMap";

import { OracleTableRenderer } from "./OracleTableRenderer";

export interface MarkdownRendererProps {
  inlineParagraph?: boolean;
  markdown: string;
  inheritColor?: boolean;
  disableLinks?: boolean;
  typographyVariant?: TypographyProps["variant"];
  sx?: SxProps<Theme>;
}

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const {
    inlineParagraph,
    markdown,
    inheritColor,
    disableLinks,
    typographyVariant,
    sx,
  } = props;

  const openDialog = useOpenDataswornDialog();
  // const openDialog = useStore((store) => store.appState.openDialog);

  const theme = useTheme();

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => {
          if (
            typeof children === "string" ||
            (Array.isArray(children) &&
              children.length > 0 &&
              typeof children[0] === "string")
          ) {
            const content =
              typeof children === "string" ? children : (children[0] as string);
            if (
              content.match(
                /^{{table:[^/]+(\/collections)?\/oracles\/[^}]+}}$/,
              ) ||
              content.match(/^{{table>[^}]+}}$/)
            ) {
              const id = content
                .replace("{{table:", "")
                .replace("}}", "")
                .replace("{{table>", "");
              let oracle: Datasworn.OracleRollable | undefined = undefined;
              try {
                const tmpOracle = IdParser.get(id) as Datasworn.OracleRollable;
                if (tmpOracle.type === "oracle_rollable") {
                  oracle = tmpOracle;
                }
              } catch {
                // Empty - if oracle is undefined we will continue parsing
              }
              if (oracle) {
                return <OracleTableRenderer oracle={oracle} />;
              }
            } else if (content.match(/^{{table:[^/]+\/truths\/[^}]+}}$/)) {
              return null;
            }
          }
          return (
            <Typography
              variant={typographyVariant ?? "body2"}
              display={inlineParagraph ? "inline" : "block"}
              color={
                inheritColor
                  ? "inherit"
                  : inlineParagraph
                    ? "textSecondary"
                    : "textPrimary"
              }
              py={inlineParagraph ? 0 : 1}
              textAlign={"left"}
              whiteSpace={"pre-wrap"}
              sx={sx}
            >
              {children}
            </Typography>
          );
        },
        li: ({ children }) => (
          <Typography
            component={"li"}
            variant={typographyVariant ?? "body2"}
            color={
              inheritColor
                ? "inherit"
                : inlineParagraph
                  ? "textSecondary"
                  : "textPrimary"
            }
            sx={sx}
          >
            {children}
          </Typography>
        ),
        ul: ({ children }) => (
          <Stack spacing={1} component={"ul"} pl={1.5} mt={1} mb={0} sx={sx}>
            {children}
          </Stack>
        ),
        table: ({ children }) => (
          <Box
            component={"table"}
            mt={2}
            mb={1}
            border={1}
            borderColor={(theme) => theme.palette.divider}
            borderRadius={(theme) => `${theme.shape.borderRadius}px`}
            sx={[
              { borderCollapse: "collapse" },
              ...(Array.isArray(sx) ? sx : [sx]),
            ]}
          >
            {children}
          </Box>
        ),
        thead: ({ children }) => (
          <Box
            component={"thead"}
            // bgcolor={(theme) => theme.palette.background.paperInlayDarker}
            sx={sx}
          >
            {children}
          </Box>
        ),
        th: ({ children }) => (
          <Typography
            component={"th"}
            variant={typographyVariant ?? "body2"}
            textAlign={"left"}
            p={1}
            minWidth={"8ch"}
            sx={sx}
          >
            <b>{children}</b>
          </Typography>
        ),
        tr: ({ children }) => (
          <Box
            component={"tr"}
            sx={[
              {
                "&:nth-of-type(even)": {
                  // backgroundColor: theme.palette.background.paperInlay,
                },
              },
              ...(Array.isArray(sx) ? sx : [sx]),
            ]}
          >
            {children}
          </Box>
        ),
        td: ({ children }) => (
          <Typography
            component={"td"}
            px={1}
            py={0.5}
            variant={typographyVariant ?? "body2"}
            color={"textPrimary"}
            sx={sx}
          >
            {children}
          </Typography>
        ),
        a: (linkProps) => {
          if (disableLinks) {
            return <>{linkProps.children}</>;
          }

          const propertiesHref = linkProps.node?.properties?.href;

          const href = typeof propertiesHref === "string" ? propertiesHref : "";

          if (href.startsWith("datasworn:")) {
            const strippedHref = href.replace("datasworn:", "");
            // We have a datasworn id
            const id = idMap[strippedHref] ?? strippedHref;

            let item: unknown;
            try {
              item = IdParser.get(id);
            } catch {
              // console.warn("Could not find in datasworn");
              // Empty - if item is undefined we will continue parsing
            }

            if (item) {
              return (
                <Link
                  component={"button"}
                  type={"button"}
                  sx={[
                    {
                      cursor: "pointer",
                      verticalAlign: "baseline",
                    },
                    ...(Array.isArray(sx) ? sx : [sx]),
                  ]}
                  color={
                    theme.palette.mode === "light" ? "info.dark" : "info.light"
                  }
                  onClick={() => openDialog(id)}
                >
                  {linkProps.children}
                </Link>
              );
            } else {
              // TODO - add error styling
              return <Typography>{linkProps.children}</Typography>;
            }
          }

          let url: URL | undefined = undefined;
          try {
            url = new URL(href);
          } catch {
            console.warn("Was not a url");
            // Empty - if url is undefined we will continue parsing
          }
          if (url) {
            return <a {...linkProps} />;
          } else {
            // TODO - add error styling
            return <Typography>{linkProps.children}</Typography>;
          }
        },
      }}
      urlTransform={(url) => url}
    >
      {markdown}
    </ReactMarkdown>
  );
}
