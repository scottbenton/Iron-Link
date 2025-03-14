import { LocalThemeProvider } from "@/providers/ThemeProvider";
import { Theme } from "@/stores/appState.store";
import { Box, Container, ContainerProps, Heading } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface PageHeaderProps {
  overline?: ReactNode;
  title?: string;
  action?: ReactNode;
}

export function PageHeader(props: PageHeaderProps & ContainerProps) {
  const { overline, title, action, ...containerProps } = props;

  return (
    <LocalThemeProvider theme={Theme.Dark}>
      <Box pt={4} pb={32} mb={-28} bg="bg.panel">
        <Container maxW="breakpoint-2xl" fluid {...containerProps}>
          {overline}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            {title && (
              <Heading as="h1" size="3xl" textTransform="uppercase">
                {title}
              </Heading>
            )}
            {action}
          </Box>
        </Container>
      </Box>
    </LocalThemeProvider>
  );
}
