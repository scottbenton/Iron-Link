import { Box } from "@mui/material";
import { ReactNode, useState } from "react";

import { WorldPermission } from "repositories/shared.types";

import { IWorld } from "services/worlds.service";

import { WorldGeneralSettings } from "./WorldGeneralSettings";
import { WorldOracleContextProvider } from "./WorldOracleContextProvider";
import { WorldWorkspaceHeader } from "./WorldWorkspaceHeader";
import { WorldCategoryManager } from "./categories/WorldCategoryManager";

export function WorldWorkspace({
  world,
  permission,
  onWorldDeleted,
  additionalSettings,
}: {
  world: IWorld;
  permission: WorldPermission | null;
  onWorldDeleted?: () => void;
  additionalSettings?: ReactNode;
}) {
  const [configuring, setConfiguring] = useState(false);
  return (
    <WorldOracleContextProvider worldId={world.id}>
      <Box>
        <WorldWorkspaceHeader
          world={world}
          configuring={configuring}
          onConfigure={() => setConfiguring(true)}
        />
        <WorldCategoryManager
          worldId={world.id}
          worldName={world.name}
          permission={permission}
          configuring={configuring}
          onDone={() => setConfiguring(false)}
          generalSettings={
            <WorldGeneralSettings
              world={world}
              permission={permission}
              onWorldDeleted={onWorldDeleted}
              additionalSettings={additionalSettings}
            />
          }
        />
      </Box>
    </WorldOracleContextProvider>
  );
}
