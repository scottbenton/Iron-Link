import { Box, BoxProps } from "@chakra-ui/react";

export interface GradientBoxProps extends BoxProps {
  hide?: boolean;
}

export function GradientBox(props: GradientBoxProps) {
  const { hide, children, css, ...rest } = props;

  return (
    <Box
      css={[
        {
          position: "relative",
          overflow: "hidden",
          "&:before": hide
            ? {}
            : {
                content: '""',
                position: "absolute",
                display: "block",
                left: "-10%",
                right: "-10%",
                top: 0,
                bottom: 0,
                margin: "auto 0",
                minWidth: "calc(100% * sqrt(2))", // Diagonal length
                minHeight: "calc(100% * sqrt(2))", // Diagonal length
                aspectRatio: "1 / 1",
                background:
                  "radial-gradient(142% 91% at 111% 84%, {colors.colorPalette.600} 20%, {colors.colorPalette.300} 80%)",
                animation: "spin 5s linear infinite",
                zIndex: 1,
                "& @media (prefers-reduced-motion) { animation: none; }": {},
              },
        },
        ...(Array.isArray(css) ? css : [css]),
      ]}
      {...rest}
    >
      <Box zIndex={2} position="relative">
        {children}
      </Box>
    </Box>
  );
}
