import { Container, ContainerProps } from "@chakra-ui/react";

export interface PageContentProps extends ContainerProps {
  disableGuttersOnMobile?: boolean;
}

export function PageContent(props: PageContentProps) {
  const { children, disableGuttersOnMobile, ...containerProps } = props;
  return (
    <Container
      as="main"
      maxW="breakpoint-2xl"
      fluid
      flexGrow={1}
      display="flex"
      flexDir="column"
      {...containerProps}
      px={disableGuttersOnMobile ? { base: 0, sm: 4, md: 6, lg: 8 } : undefined}
    >
      {children}
    </Container>
  );
}
