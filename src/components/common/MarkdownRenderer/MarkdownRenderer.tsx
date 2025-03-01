import { idMap } from "@/data/idMap";
import { useOpenDataswornDialog } from "@/stores/appState.store";
import { Box, Link, Stack, Text, TextProps } from "@chakra-ui/react";
import { Datasworn, IdParser } from "@datasworn/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { OracleTableRenderer } from "./OracleTableRenderer";

const ignoredDataswornLinkTypes = ["atlas_entry"];

export interface MarkdownRendererProps {
  inlineParagraph?: boolean;
  markdown: string;
  inheritColor?: boolean;
  disableLinks?: boolean;
  fontSize?: TextProps["fontSize"];
}

export function MarkdownRenderer(props: MarkdownRendererProps) {
  const { inlineParagraph, markdown, inheritColor, disableLinks, fontSize } =
    props;

  const openDialog = useOpenDataswornDialog();
  // const openDialog = useStore((store) => store.appState.openDialog);

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
            <Text
              fontSize={fontSize ?? "sm"}
              display={inlineParagraph ? "inline" : "block"}
              color={
                inheritColor ? "inherit" : inlineParagraph ? "fg.muted" : "fg"
              }
              py={inlineParagraph ? 0 : 1}
              textAlign={"left"}
              whiteSpace={"pre-wrap"}
            >
              {children}
            </Text>
          );
        },
        li: ({ children }) => (
          <Text
            as={"li"}
            fontSize={fontSize ?? "sm"}
            color={
              inheritColor ? "inherit" : inlineParagraph ? "fg.muted" : "fg"
            }
          >
            {children}
          </Text>
        ),
        ul: ({ children }) => (
          <Stack as={"ul"} pl={3} mt={2} mb={0} listStyle="outside">
            {children}
          </Stack>
        ),
        table: ({ children }) => (
          <Box
            as={"table"}
            mt={4}
            mb={2}
            border={1}
            borderColor={"border"}
            borderRadius={"sm"}
            borderCollapse={"collapse"}
          >
            {children}
          </Box>
        ),
        thead: ({ children }) => <Box as={"thead"}>{children}</Box>,
        th: ({ children }) => (
          <Text
            as={"th"}
            fontSize={fontSize ?? "sm"}
            textAlign={"left"}
            p={1}
            minWidth={"8ch"}
          >
            <b>{children}</b>
          </Text>
        ),
        tr: ({ children }) => (
          <Box
            as={"tr"}
            _even={{
              bg: "bg.subtle",
            }}
          >
            {children}
          </Box>
        ),
        td: ({ children }) => (
          <Text
            as={"td"}
            px={1}
            py={0.5}
            fontSize={fontSize ?? "sm"}
            color={"textPrimary"}
          >
            {children}
          </Text>
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

            if (
              item &&
              !ignoredDataswornLinkTypes.some((type) => href.includes(type))
            ) {
              return (
                <Link
                  as={"button"}
                  type={"button"}
                  cursor="pointer"
                  verticalAlign="baseline"
                  color="fg.info"
                  onClick={() => openDialog(id)}
                >
                  {linkProps.children}
                </Link>
              );
            } else {
              // TODO - add error styling
              return <Text color="fg.error">{linkProps.children}</Text>;
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
            return <Text color="fg.error">{linkProps.children}</Text>;
          }
        },
      }}
      urlTransform={(url) => url}
    >
      {markdown}
    </ReactMarkdown>
  );
}
