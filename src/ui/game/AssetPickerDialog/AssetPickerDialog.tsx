import type { Datasworn } from "@datasworn-community/core";
import { CaretLeft } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Dialog,
  DialogActions,
  DialogDoneButton,
  DialogHeader,
} from "ui/components/Dialog";
import { SearchField } from "ui/components/SearchField";
import { Text } from "ui/components/Text";
import { useElementWidth } from "ui/hooks/useElementWidth";

import { css, cx } from "styled-system/css";

import { AssetCard } from "../AssetCard";
import { AssetPickerGroups } from "./AssetPickerGroups";
import { AssetPickerGroup, filterGroups } from "./assetPickerSearch";
import {
  AssetPickerStrings,
  getDefaultAssetPickerStrings,
} from "./assetPickerStrings";

// The dialog keeps the same height whichever group is open, so the panes
// scroll instead of the dialog changing size under the pointer.
const popupStyles = css({
  height: "min(720px, calc(100dvh - 48px))",
});

const searchStyles = css({
  flex: "none",
  paddingInline: "5",
  paddingBlock: "3",
  borderBottom: "1px solid token(colors.border.subtle)",
});

// The dialog's width leaves the card column about 520px, so the card reads
// as a card rather than a full-width panel.
const DIALOG_WIDTH = 900;
/** Below this much room the list and the card take turns. */
const SIDE_BY_SIDE_WIDTH = 640;

const bodyStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  flex: "1 1 auto",
  minHeight: 0,
  overflow: "hidden",
  "&[data-wide]": {
    gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
  },
});

const paneStyles = css({
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overscrollBehavior: "contain",
});

const detailStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 520px)",
  alignContent: "start",
  gap: "3",
  padding: "4",
  borderInlineStart: "1px solid token(colors.border.subtle)",
});

const resultsStyles = css({
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "0.5",
  paddingInline: "3",
  paddingBlockStart: "3",
});

export interface AssetPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** The asset types to choose from, in order. */
  groups: AssetPickerGroup[];
  /** Adds the asset; the dialog then closes. */
  onAdd: (asset: Datasworn.Asset) => void;
  strings?: Partial<AssetPickerStrings>;
}

/**
 * Picks an asset to add: the asset types as collapsible groups, every one
 * closed at first, and the picked asset's card beside them. Search opens
 * every group, counts the results and marks the match in each row. With
 * less than 640px of dialog the list and the card take turns, with a way
 * back to the list. Each row has its own Add; the footer adds the asset
 * whose card is showing.
 */
export function AssetPickerDialog(props: AssetPickerDialogProps) {
  const { open, onClose, groups, onAdd, strings: stringsProp } = props;
  const { t } = useTranslation();
  const strings = { ...getDefaultAssetPickerStrings(t), ...stringsProp };

  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [showDetail, setShowDetail] = useState(false);
  const [bodyRef, width] = useElementWidth();
  const wide = width === undefined || width >= SIDE_BY_SIDE_WIDTH;

  const search = query.trim().toLowerCase();
  const shownGroups = useMemo(
    () => filterGroups(groups, search),
    [groups, search],
  );
  const isOpen = (group: AssetPickerGroup) =>
    search ? true : openGroups.includes(group.id);
  const visible = shownGroups.filter(isOpen).flatMap((group) => group.assets);
  const selected = visible.find((asset) => asset._id === selectedId);
  const showingCard = !!selected && (wide || showDetail);

  const close = () => {
    setQuery("");
    setOpenGroups([]);
    setSelectedId(undefined);
    setShowDetail(false);
    onClose();
  };

  const add = (asset: Datasworn.Asset) => {
    onAdd(asset);
    close();
  };

  const pick = (asset: Datasworn.Asset) => {
    setSelectedId(asset._id);
    if (!wide) setShowDetail(true);
  };

  const card = selected && (
    <AssetCard asset={selected} readOnly headingAs="h3" />
  );

  const list = (
    <div className={paneStyles}>
      {search && (
        <div className={resultsStyles}>
          <Text as="h3" variant="h4">
            {strings.results(visible.length)}
          </Text>
          <Text variant="caption" color="muted">
            {strings.resultsFor(query.trim())}
          </Text>
        </div>
      )}
      {shownGroups.length === 0 ? (
        <Text variant="bodySm" color="muted" className={css({ padding: "4" })}>
          {strings.noMatches(query.trim())}
        </Text>
      ) : (
        <AssetPickerGroups
          groups={shownGroups}
          query={search}
          isOpen={isOpen}
          onOpenChange={(group, next) =>
            setOpenGroups((current) =>
              next
                ? [...current, group.id]
                : current.filter((id) => id !== group.id),
            )
          }
          currentId={wide ? selected?._id : undefined}
          onPick={pick}
          onAdd={add}
          strings={strings}
        />
      )}
    </div>
  );

  let body;
  if (!wide && showDetail && selected) {
    body = (
      <div className={paneStyles}>
        <div className={css({ padding: "2" })}>
          <Button
            variant="text"
            startIcon={<CaretLeft weight="bold" />}
            onClick={() => setShowDetail(false)}
          >
            {search ? strings.backToResults : strings.backToAssets}
          </Button>
        </div>
        <div className={css({ paddingInline: "4", paddingBlockEnd: "4" })}>
          {card}
        </div>
      </div>
    );
  } else {
    body = (
      <>
        {list}
        {wide && (
          <div className={cx(paneStyles, detailStyles)}>
            {card ?? (
              <Text variant="bodySm" color="muted">
                {strings.pickPrompt}
              </Text>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth={DIALOG_WIDTH}
      fullScreenOnMobile
      className={popupStyles}
    >
      <DialogHeader title={strings.title} />
      <div className={searchStyles}>
        <SearchField
          label={strings.searchLabel}
          placeholder={strings.searchPlaceholder}
          value={query}
          onValueChange={(next) => {
            setQuery(next);
            setShowDetail(false);
          }}
        />
      </div>
      <div ref={bodyRef} className={bodyStyles} data-wide={wide || undefined}>
        {body}
      </div>
      <DialogActions>
        <DialogDoneButton variant="ghost" label={strings.cancel} />
        {showingCard && selected && (
          <Button variant="primary" onClick={() => add(selected)}>
            {strings.addAsset(selected.name)}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
