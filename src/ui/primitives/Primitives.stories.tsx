import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReactNode } from "react";

import { Text } from "../components/Text";
import {
  Box,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Spacer,
  Stack,
} from "./index";

const meta: Meta = {
  title: "Foundations/Layout primitives",
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

function Tile(props: { children: ReactNode }) {
  return (
    <Box
      paddingBlock="2"
      paddingInline="3"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border.default"
      background="bg.surface"
    >
      <Text variant="bodySm">{props.children}</Text>
    </Box>
  );
}

function Section(props: { title: string; note: string; children: ReactNode }) {
  return (
    <Stack gap="3">
      <Stack gap="1">
        <Text variant="h3" as="h2">
          {props.title}
        </Text>
        <Text variant="bodySm" color="muted">
          {props.note}
        </Text>
      </Stack>
      {props.children}
    </Stack>
  );
}

/**
 * The layout pieces screens build with, from `ui/primitives`. Each takes
 * style props with the theme's tokens, so screens never import Panda.
 */
export const Overview: Story = {
  render: () => (
    <Container size="lg" paddingBlock="8">
      <Stack gap="10">
        <Stack gap="2">
          <Text variant="h1">Layout primitives</Text>
          <Text color="muted">
            Import these from ui/primitives. They replace MUI's Box, Stack, Grid
            and Container, and nothing outside src/ui calls Panda.
          </Text>
        </Stack>

        <Section
          title="Box"
          note="Any element with style props. Use it for one-off spacing, colour and borders."
        >
          <Box
            padding="4"
            borderRadius="lg"
            background="bg.muted"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <Text>padding 4, radius lg, bg.muted</Text>
          </Box>
        </Section>

        <Section
          title="Stack, HStack"
          note="A column or a row with a gap. MUI's spacing={2} is gap 4 here (16px)."
        >
          <HStack gap="6" alignItems="flex-start">
            <Stack gap="2">
              <Tile>Stack</Tile>
              <Tile>gap 2</Tile>
              <Tile>Third</Tile>
            </Stack>
            <HStack gap="2">
              <Tile>HStack</Tile>
              <Tile>gap 2</Tile>
            </HStack>
          </HStack>
        </Section>

        <Section
          title="Flex and Spacer"
          note="A row that wraps or pushes things apart. Spacer takes the room between."
        >
          <Flex gap="2" flexWrap="wrap">
            <Tile>Edge</Tile>
            <Tile>Edge</Tile>
            <Spacer />
            <Tile>Pushed to the end</Tile>
          </Flex>
        </Section>

        <Section
          title="Grid and GridItem"
          note="Columns with a gap. GridItem spans columns."
        >
          <Grid columns={3} gap="3">
            <GridItem colSpan={2}>
              <Tile>colSpan 2</Tile>
            </GridItem>
            <Tile>One</Tile>
            <Tile>One</Tile>
            <Tile>One</Tile>
            <Tile>One</Tile>
          </Grid>
        </Section>

        <Section
          title="Center"
          note="Centres its child both ways, for empty states and loaders."
        >
          <Center
            height="120px"
            borderRadius="lg"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="border.default"
          >
            <Text color="muted">Nothing here yet</Text>
          </Center>
        </Section>

        <Section
          title="Container"
          note="A centred column with the page's side padding. Sizes match page widths: sm 640, md 900, lg 1200, xl 1440 (default), full."
        >
          <Box background="bg.muted" borderRadius="lg" paddingBlock="3">
            <Container size="sm">
              <Tile>Container size sm</Tile>
            </Container>
          </Box>
        </Section>
      </Stack>
    </Container>
  ),
};
