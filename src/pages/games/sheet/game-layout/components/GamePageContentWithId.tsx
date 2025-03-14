import { PageContent } from "@/components/layout/PageContent";
import { useCharacterIdOptional } from "@/hooks/useCharacterId";
import { PropsWithChildren } from "react";

export function GamePageContentWithId(props: PropsWithChildren) {
  const { children } = props;

  const characterId = useCharacterIdOptional();
  return (
    <PageContent
      id={
        characterId
          ? `character-tab-panel-${characterId}`
          : "overview-tab-panel"
      }
    >
      {children}
    </PageContent>
  );
}
