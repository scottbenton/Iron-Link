import { Box, Typography } from "@mui/material";

import { RulesText } from "ui/game/RulesText";

export interface RollResultProps {
  result?: string;
  markdown?: string;
  secondaryMarkdown?: string;
  extras?: string[];
}

export function RollResult(props: RollResultProps) {
  const { result, markdown, secondaryMarkdown, extras } = props;

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      alignItems={"flex-start"}
      justifyContent={"center"}
    >
      {result && (
        <Typography
          color={"white"}
          variant={"h5"}
          component={"p"}
          fontFamily={(theme) => theme.typography.fontFamilyTitle}
        >
          {result}
        </Typography>
      )}
      {markdown && (
        <Box maxWidth={"30ch"}>
          <RulesText
            markdown={markdown}
            size="sm"
            color="inherit"
            disableLinks
          />
        </Box>
      )}
      {secondaryMarkdown && (
        <Box maxWidth={"30ch"}>
          <RulesText
            markdown={secondaryMarkdown}
            size="sm"
            color="inherit"
            disableLinks
          />
        </Box>
      )}
      {Array.isArray(extras) &&
        extras.map((extra) => (
          <Typography
            key={extra}
            color={"grey.200"}
            variant={"caption"}
            component={"p"}
            fontFamily={(theme) => theme.typography.fontFamilyTitle}
          >
            {extra}
          </Typography>
        ))}
    </Box>
  );
}
