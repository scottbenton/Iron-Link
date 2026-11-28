import { useCallback } from "react";

import {
  DataswornFeaturedOracle,
  DataswornOracleTree,
  RenderOracleRow,
} from "components/datasworn/DataswornTree";

import { Box } from "ui/primitives";

import { useGamePermissions } from "pages/games/gamePageLayout/hooks/usePermissions";
import { useRollOracleAndAddToLog } from "pages/games/hooks/useRollOracleAndAddToLog";

import { GamePermission } from "stores/game.store";

import { OracleTreeRow } from "./OracleTreeRow";
import { OracleTreeSharedTextRow } from "./OracleTreeSharedTextRow";

export type OracleTreeFeaturedOracle = DataswornFeaturedOracle;

export interface OracleTreeProps {
  // Oracles listed first under their own heading, above the rules packages.
  // The filter narrows them by name; ones not in the rules are left out.
  featured?: {
    title: string;
    oracles: OracleTreeFeaturedOracle[];
  };
}

// The oracles in a game: every row rolls into the game log, a Guide's rolls
// staying with the Guide.
export function OracleTree(props: OracleTreeProps) {
  const { featured } = props;
  const rollOracleAndAddToLog = useRollOracleAndAddToLog();
  const isGuide = useGamePermissions().gamePermission === GamePermission.Guide;

  const rollOracle = useCallback(
    (oracleId: string) => rollOracleAndAddToLog(oracleId, isGuide),
    [rollOracleAndAddToLog, isGuide],
  );

  const renderOracle = useCallback<RenderOracleRow>(
    (oracle) =>
      oracle.canRoll ? (
        <OracleTreeRow
          id={oracle.id}
          name={oracle.name}
          description={oracle.description}
          rollOracle={rollOracle}
        />
      ) : (
        <OracleTreeSharedTextRow
          id={oracle.id}
          name={oracle.name}
          rollOracle={rollOracle}
        />
      ),
    [rollOracle],
  );

  return (
    <Box padding="3">
      <DataswornOracleTree
        featured={featured}
        renderOracle={renderOracle}
        rollOracle={rollOracle}
      />
    </Box>
  );
}
