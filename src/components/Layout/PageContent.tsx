import { Card, Container, ContainerProps } from "@chakra-ui/react";

export interface PageContentProps extends ContainerProps {
  disableGuttersOnMobile?: boolean;
  sheet?: boolean;
}

export function PageContent(props: PageContentProps) {
  const { children, disableGuttersOnMobile, sheet, ...containerProps } = props;
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
      {sheet ? (
        <Card.Root flexGrow={1} borderBottomRadius={0} borderBottomWidth={0}>
          <Card.Body>{children}</Card.Body>
        </Card.Root>
      ) : (
        <>{children}</>
      )}
    </Container>
  );
}
