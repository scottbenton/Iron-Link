import { LocalThemeProvider } from "@/providers/ThemeProvider";
import { Theme } from "@/stores/appState.store";
import { Box, Container, ContainerProps, Heading } from "@chakra-ui/react";
import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader(props: PageHeaderProps & ContainerProps) {
  const { title, action, ...containerProps } = props;

  return (
    <LocalThemeProvider theme={Theme.Dark}>
      <Box pt={4} pb={24} mb={-20} bg="bg.panel">
        <Container
          maxW="breakpoint-2xl"
          fluid
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          {...containerProps}
        >
          <Heading as="h1" size="3xl" textTransform="uppercase">
            {title}
          </Heading>
          {action}
        </Container>
      </Box>
    </LocalThemeProvider>
  );
}
