import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Collapse,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader,
  TextField,
} from "@mui/material";
import React, {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";

import { LinkComponent } from "components/LinkComponent";

import {
  ReferenceTreeCollection,
  getAncestorCollectionIds,
  getReferenceTreeVisibility,
  isLeafCollection,
} from "../data/referenceTreeFilter";

export interface ReferenceTreeGroup {
  id: string;
  title?: string;
  rootCollectionIds: string[];
}

export interface ReferenceTreeProps {
  label: string;
  searchLabel: string;
  groups: ReferenceTreeGroup[];
  collectionMap: Record<string, ReferenceTreeCollection>;
  selectedId: string | undefined;
  isSourceVisible: (id: string) => boolean;
  getHref: (id: string) => string | undefined;
  // A control at the end of an item's row, like an oracle's quick roll.
  renderItemAction?: (item: { _id: string; name: string }) => React.ReactNode;
  emptyMessage: string;
}

// The list beside a moves or oracles page. Items and shared-table collections
// are links, so a reader can open one in a new tab or copy its address.
export function ReferenceTree(props: ReferenceTreeProps) {
  const {
    label,
    searchLabel,
    groups,
    collectionMap,
    selectedId,
    isSourceVisible,
    getHref,
    renderItemAction,
    emptyMessage,
  } = props;

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const isSearching = deferredSearch.trim().length > 0;

  const allRootIds = useMemo(
    () => groups.flatMap((group) => group.rootCollectionIds),
    [groups],
  );

  const visibility = useMemo(
    () =>
      getReferenceTreeVisibility(
        allRootIds,
        collectionMap,
        deferredSearch,
        isSourceVisible,
      ),
    [allRootIds, collectionMap, deferredSearch, isSourceVisible],
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // Open the collections around the item on the page.
  useEffect(() => {
    if (!selectedId) return;
    const ancestors = getAncestorCollectionIds(
      allRootIds,
      collectionMap,
      selectedId,
    );
    if (ancestors.length === 0) return;
    setExpanded((previous) => {
      if (ancestors.every((id) => previous.has(id))) return previous;
      const next = new Set(previous);
      ancestors.forEach((id) => next.add(id));
      return next;
    });
  }, [selectedId, allRootIds, collectionMap]);

  const toggle = (id: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderItemLink = (
    item: { _id: string; name: string },
    depth: number,
  ) => {
    const href = getHref(item._id);
    const selected = item._id === selectedId;
    return (
      <ListItem
        key={item._id}
        disablePadding
        secondaryAction={renderItemAction?.(item)}
      >
        <ListItemButton
          component={LinkComponent}
          href={href ?? ""}
          selected={selected}
          aria-current={selected ? "page" : undefined}
          sx={{ pl: 2 + depth * 2 }}
        >
          <ListItemText primary={item.name} />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderCollection = (
    collectionId: string,
    depth: number,
  ): React.ReactNode => {
    const collection = collectionMap[collectionId];
    if (!collection || !visibility.collections.has(collectionId)) return null;

    if (isLeafCollection(collection)) {
      return renderItemLink(collection, depth);
    }

    const isOpen = isSearching || expanded.has(collectionId);
    return (
      <React.Fragment key={collectionId}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => toggle(collectionId)}
            aria-expanded={isOpen}
            disabled={isSearching}
            sx={{ pl: 2 + depth * 2, "&.Mui-disabled": { opacity: 1 } }}
          >
            <ListItemText
              primary={collection.name}
              slotProps={{
                primary: {
                  fontFamily: (theme) => theme.typography.fontFamilyTitle,
                  textTransform: "uppercase",
                },
              }}
            />
            {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>
        <Collapse in={isOpen} unmountOnExit>
          <List disablePadding>
            {Object.values(collection.contents ?? {})
              .filter((item) => visibility.items.has(item._id))
              .map((item) => renderItemLink(item, depth + 1))}
            {Object.values(collection.collections ?? {}).map((subCollection) =>
              renderCollection(subCollection._id, depth + 1),
            )}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  const visibleGroups = groups.filter((group) =>
    group.rootCollectionIds.some((id) => visibility.collections.has(id)),
  );

  return (
    <Box>
      <TextField
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        label={searchLabel}
        size="small"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 1 }}
      />
      <nav aria-label={label}>
        {visibleGroups.length === 0 ? (
          <Box color="text.secondary" p={2}>
            {emptyMessage}
          </Box>
        ) : (
          visibleGroups.map((group) => (
            <ReferenceTreeGroupList key={group.id} title={group.title}>
              {group.rootCollectionIds.map((id) => renderCollection(id, 0))}
            </ReferenceTreeGroupList>
          ))
        )}
      </nav>
    </Box>
  );
}

function ReferenceTreeGroupList(
  props: React.PropsWithChildren<{ title?: string }>,
) {
  const { title, children } = props;
  const titleId = useId();
  return (
    <List
      dense
      aria-labelledby={title ? titleId : undefined}
      subheader={
        title ? (
          <ListSubheader id={titleId} sx={{ bgcolor: "background.paper" }}>
            {title}
          </ListSubheader>
        ) : undefined
      }
    >
      {children}
    </List>
  );
}
