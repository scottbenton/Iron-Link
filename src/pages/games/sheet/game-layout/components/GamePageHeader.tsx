import { PageHeader } from "@/components/layout/PageHeader";

import { CharacterTabs } from "./CharacterTabs";

export function GamePageHeader() {
  return <PageHeader overline={<CharacterTabs />} mb={{ base: 0, md: -4 }} />;
}
