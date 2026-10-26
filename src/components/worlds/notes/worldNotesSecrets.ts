import type { SecretsConfig } from "components/RichTextEditor/secrets/useSecretsCompanion";

import {
  ReadPermissions,
  WorldPermission,
  isGuideEquivalent,
} from "repositories/shared.types";

import type { SecretSurface } from "services/richTextSecrets.service";

// The secrets of a world's Notes or an entry's Notes, for whoever is reading
// them. Only world Guides (owner, editor or guide) get them. New secrets are
// offered only in a guided world, and not in an entry only Guides can read.
export function getWorldSecretsConfig(params: {
  worldId: string;
  surface: SecretSurface;
  permission: WorldPermission | null;
  isGuided: boolean;
  // An entry's read permissions; world Notes have none of their own.
  readPermissions?: ReadPermissions;
}): SecretsConfig | null {
  const { worldId, surface, permission, isGuided, readPermissions } = params;
  if (!permission || !isGuideEquivalent(permission)) return null;
  return {
    surface,
    roomKeySource: { guideWorldId: worldId },
    canInsert: isGuided && readPermissions !== ReadPermissions.OnlyGuides,
  };
}
