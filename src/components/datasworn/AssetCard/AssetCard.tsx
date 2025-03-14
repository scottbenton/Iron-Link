import { useAsset } from "@/hooks/datasworn/useAsset";
import { IAsset } from "@/services/asset.service";
import { Card, Text } from "@chakra-ui/react";
import { Datasworn } from "@datasworn/core";

import { AssetAbilities } from "./AssetAbilities";
import { AssetControls } from "./AssetControls";
import { AssetHeader } from "./AssetHeader";
import { AssetNameAndDescription } from "./AssetNameAndDescription";
import { AssetOptions } from "./AssetOptions";

export interface AssetCardProps {
  assetId: string;
  assetDocument?: IAsset;
  headerActions?: React.ReactNode;
  actions?: React.ReactNode;

  onAssetAbilityToggle?: (abilityIndex: number, checked: boolean) => void;
  onAssetOptionChange?: (assetOptionKey: string, value: string) => void;
  onAssetControlChange?: (
    controlKey: string,
    value: boolean | string | number,
  ) => void;

  hideUnavailableAbilities?: boolean;
  showSharedIcon?: boolean;
}

export function AssetCard(props: AssetCardProps) {
  const {
    assetId,
    assetDocument,
    headerActions,
    actions,
    onAssetAbilityToggle,
    onAssetOptionChange,
    onAssetControlChange,
    showSharedIcon,
    hideUnavailableAbilities,
  } = props;

  const asset = useAsset(assetId);

  if (!asset) {
    return (
      <Card.Root
        variant={"outline"}
        w={"100%"}
        h={"100%"}
        borderColor="border.error"
      >
        <AssetHeader
          id={assetId}
          category={"Error Loading Asset"}
          actions={headerActions}
        />
        <Card.Body px={2} pt={1} pb={2}>
          <Text>Asset with id "{assetId}" could not be found.</Text>
        </Card.Body>
      </Card.Root>
    );
  }

  const assetControls: Record<
    string,
    Datasworn.AssetControlField | Datasworn.AssetAbilityControlField
  > = { ...asset.controls };
  const assetOptions = { ...asset.options };

  asset.abilities.forEach((ability, index) => {
    const isEnabled = ability.enabled || assetDocument?.enabledAbilities[index];

    if (isEnabled) {
      const controls = ability.controls ?? {};
      const options = ability.options ?? {};
      Object.keys(controls).forEach((controlKey) => {
        assetControls[controlKey] = controls[controlKey];
      });
      Object.keys(options).forEach((optionKey) => {
        assetOptions[optionKey] = options[optionKey];
      });

      const enhanceControls = ability.enhance_asset?.controls ?? {};
      Object.keys(enhanceControls).forEach((controlKey) => {
        const enhancement = enhanceControls[controlKey];
        const assetControl = assetControls[controlKey];
        if (assetControl?.field_type === enhancement.field_type) {
          assetControls[controlKey] = {
            ...assetControl,
            ...(enhancement as Partial<typeof assetControl>),
          };
        }
      });
    }
  });

  return (
    <Card.Root
      variant={"outline"}
      w="100%"
      h="100%"
      display="flex"
      flexDir="column"
    >
      <AssetHeader
        id={asset._id}
        category={asset.category}
        actions={headerActions}
      />
      <Card.Body
        px={4}
        pt={2}
        pb={4}
        display="flex"
        flexDirection={"column"}
        flexGrow={1}
      >
        <AssetNameAndDescription
          name={asset.name}
          description={asset.requirement}
          shared={asset.shared}
          showSharedIcon={showSharedIcon}
        />
        <AssetOptions
          assetDocument={assetDocument}
          options={assetOptions}
          onAssetOptionChange={onAssetOptionChange}
        />
        <AssetAbilities
          abilities={asset.abilities}
          assetDocument={assetDocument}
          onAbilityToggle={onAssetAbilityToggle}
          hideUnavailableAbilities={hideUnavailableAbilities}
        />
        <AssetControls
          controls={assetControls}
          assetDocument={assetDocument}
          onControlChange={onAssetControlChange}
        />
      </Card.Body>
      {actions && (
        <Card.Footer
          justifyContent="flex-end"
          mt={2}
          px={1}
          py={1}
          bg="bg.muted"
          borderBottomRadius={"inherit"}
        >
          {actions}
        </Card.Footer>
      )}
    </Card.Root>
  );
}
