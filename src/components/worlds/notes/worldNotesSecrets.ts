import type { SecretsConfig } from "components/RichTextEditor/secrets/useSecretsCompanion";

import { WorldPermission, isGuideEquivalent } from "repositories/shared.types";

import type { SecretSurface } from "services/richTextSecrets.service";

// The secrets of a world's Notes or an entry's Notes, for whoever is reading
// them. Only world Guides (owner, editor or guide) get them. New secrets are
// offered in a guided world, including entries only Guides read so far, so a
// Guide can prepare them before sharing. A world that isn't guided still shows
// the secrets it has.
export function getWorldSecretsConfig(params: {
  worldId: string;
  surface: SecretSurface;
  permission: WorldPermission | null;
  isGuided: boolean;
}): SecretsConfig | null {
  const { worldId, surface, permission, isGuided } = params;
  if (!permission || !isGuideEquivalent(permission)) return null;
  return {
    surface,
    roomKeySource: { guideWorldId: worldId },
    audience: "guides",
    canInsert: isGuided,
  };
}
