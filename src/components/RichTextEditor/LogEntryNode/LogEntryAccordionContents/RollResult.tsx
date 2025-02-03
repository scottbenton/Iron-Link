import { Box, Typography } from "@mui/material";

import { MarkdownRenderer } from "components/MarkdownRenderer";

export interface RollResultProps {
  result?: string;
  markdown?: string;
  extras?: string[];
}

export function RollResult(props: RollResultProps) {
  const { result, markdown, extras } = props;

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      alignItems={"flex-start"}
      justifyContent={"center"}
    >
      {result && (
        <Typography
          variant={"h5"}
          component={"p"}
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {result}
        </Typography>
      )}
      {markdown && (
        <Box maxWidth={"30ch"}>
          <MarkdownRenderer markdown={markdown} inheritColor disableLinks />
        </Box>
      )}
      {Array.isArray(extras) &&
        extras.map((extra) => (
          <Typography
            key={extra}
            color={"textSecondary"}
            variant={"body2"}
            component={"p"}
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
          >
            {extra}
          </Typography>
        ))}
    </Box>
  );
}
