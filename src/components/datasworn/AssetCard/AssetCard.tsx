import { ElementType, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "ui/components/Alert";
import {
  AssetControl,
  AssetControlValue,
  AssetCard as LibraryAssetCard,
  getAssetFields,
} from "ui/game/AssetCard";
import { CssProp } from "ui/styles/cssProp";

import { useRollStatAndAddToLog } from "pages/games/hooks/useRollStatAndAddToLog";

import { useAsset } from "hooks/datasworn/useAsset";

import { useGameCharacter } from "stores/gameCharacters.store";

import { DEFAULT_MOMENTUM } from "data/constants";

import { IAsset } from "services/asset.service";

import { useDebouncedClockChanges } from "./useDebouncedClockChanges";

export interface AssetCardProps extends CssProp {
  assetId: string;
  assetDocument?: IAsset;
  headerActions?: ReactNode;
  actions?: ReactNode;

  onAssetAbilityToggle?: (abilityIndex: number, checked: boolean) => void;
  onAssetOptionChange?: (assetOptionKey: string, value: string) => void;
  onAssetControlChange?: (controlKey: string, value: AssetControlValue) => void;

  hideUnavailableAbilities?: boolean;
  showSharedIcon?: boolean;
  /** The element for the asset's name, so headings nest. An h3 by default. */
  headingAs?: ElementType;
  className?: string;
}

/**
 * The library's asset card for an asset in the loaded rules, with a
 * character's ticks and values from Iron Link. Rolling a meter (a
 * companion's Health) rolls it with the character's momentum and logs it.
 */
export function AssetCard(props: AssetCardProps) {
  const {
    assetId,
    assetDocument,
    headerActions,
    actions,
    onAssetAbilityToggle,
    onAssetOptionChange,
    onAssetControlChange,
    hideUnavailableAbilities,
    showSharedIcon,
    headingAs,
    className,
    css,
  } = props;
  const { t } = useTranslation();

  const asset = useAsset(assetId);
  const momentum = useGameCharacter(
    (character) => character?.momentum ?? DEFAULT_MOMENTUM,
  );
  const rollStat = useRollStatAndAddToLog();

  const controls = asset ? getAssetFields(asset, assetDocument).controls : {};
  const debounced = useDebouncedClockChanges(
    assetDocument,
    controls,
    onAssetControlChange,
  );

  if (!asset) {
    return (
      <Alert
        tone="danger"
        title={t("datasworn.asset-card.not-found-title", "Error loading asset")}
        className={className}
        css={css}
      >
        {t(
          "datasworn.asset-card.not-found",
          'Asset with id "{{id}}" could not be found.',
          { id: assetId },
        )}
      </Alert>
    );
  }

  const handleRoll = (key: string, control: AssetControl, value: number) => {
    rollStat({
      statId: key,
      statLabel: control.label,
      statModifier: value,
      momentum,
    });
  };

  return (
    <LibraryAssetCard
      asset={asset}
      state={debounced.state}
      onAbilityToggle={onAssetAbilityToggle}
      onOptionChange={onAssetOptionChange}
      onControlChange={debounced.onControlChange}
      // Only someone who can change the meter can roll it.
      onRollControl={onAssetControlChange ? handleRoll : undefined}
      showSharedIcon={showSharedIcon}
      collapsed={hideUnavailableAbilities}
      headerActions={headerActions}
      actions={actions}
      headingAs={headingAs}
      className={className}
      css={css}
    />
  );
}
