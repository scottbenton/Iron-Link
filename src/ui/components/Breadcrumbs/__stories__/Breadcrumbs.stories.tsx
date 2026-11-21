import { GlobeHemisphereWest } from "@phosphor-icons/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BreadcrumbItem, Breadcrumbs } from "..";

const meta: Meta<typeof Breadcrumbs> = {
  title: "Components/Breadcrumbs",
  component: Breadcrumbs,
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const WorldEntry: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem href="#worlds" icon={<GlobeHemisphereWest />}>
        The Forge
      </BreadcrumbItem>
      <BreadcrumbItem href="#sectors">Sectors</BreadcrumbItem>
      <BreadcrumbItem href="#devils-tail">Devil's Tail</BreadcrumbItem>
      <BreadcrumbItem current>Bleakhold Station</BreadcrumbItem>
    </Breadcrumbs>
  ),
};

/** Router links render through `render`. */
export const RouterLinks: Story = {
  render: () => (
    <Breadcrumbs>
      <BreadcrumbItem render={<a href="#/games" />}>Games</BreadcrumbItem>
      <BreadcrumbItem render={<a href="#/games/forge" />}>
        The Forge Saga
      </BreadcrumbItem>
      <BreadcrumbItem current>Kira Vale</BreadcrumbItem>
    </Breadcrumbs>
  ),
};
