import CloseIcon from "@mui/icons-material/Close";
import ReferenceIcon from "@mui/icons-material/MenuBook";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import { ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { WorldViewHeaderActionContext } from "components/worlds/worldViewHeaderAction";

import { useElementWidth } from "hooks/useElementWidth";
import { useIsMobile } from "hooks/useIsMobile";

import {
  WORLD_REFERENCE_WIDTH,
  getWorldReferencePlacement,
} from "lib/worldReference";

type WorldPageTab = "world" | "reference";

export interface WorldPageLayoutProps {
  world: ReactNode;
  // Renders the Reference column's contents. headingAction goes beside its
  // heading; hideHeading is set on phones, where a tab names the panel.
  reference: (options: {
    headingId: string;
    headingAction?: ReactNode;
    hideHeading?: boolean;
  }) => ReactNode;
}

// The Worlds page: the world in a Notes-like pane with Reference beside it.
// Reference is docked whenever the page has room for it; when it does not, a
// Reference button at the end of the breadcrumb row opens it over the world.
// That reads the page's own width, not the window's. Phones get World and
// Reference tabs instead.
export function WorldPageLayout(props: WorldPageLayoutProps) {
  const { world, reference } = props;
  const { t } = useTranslation();

  const isMobile = useIsMobile();
  const [pageRef, pageWidth] = useElementWidth<HTMLDivElement>();
  const placement = getWorldReferencePlacement(pageWidth);

  const [tab, setTab] = useState<WorldPageTab>("world");
  const [referenceOpen, setReferenceOpen] = useState(false);

  const id = useId();
  const headingId = `${id}-reference-heading`;
  const panelId = `${id}-reference`;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Reference opened over the world, then given room, docks instead.
  useEffect(() => {
    if (placement === "docked") setReferenceOpen(false);
  }, [placement]);

  const closeReference = () => {
    setReferenceOpen(false);
    toggleRef.current?.focus();
  };

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, value: WorldPageTab) => setTab(value)}
          variant="fullWidth"
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.palette.divider}`,
          })}
        >
          <Tab
            id={`${id}-tab-world`}
            aria-controls={`${id}-panel-world`}
            label={t("worlds.page.world-tab", "World")}
            value="world"
          />
          <Tab
            id={`${id}-tab-reference`}
            aria-controls={`${id}-panel-reference`}
            label={t("game.reference", "Reference")}
            value="reference"
          />
        </Tabs>
        {/* Both stay mounted, so switching keeps the Notes being edited and
            the oracle filter. */}
        <Box
          role="tabpanel"
          id={`${id}-panel-world`}
          aria-labelledby={`${id}-tab-world`}
          hidden={tab !== "world"}
          sx={{
            display: tab === "world" ? "flex" : "none",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          {world}
        </Box>
        <Box
          role="tabpanel"
          id={`${id}-panel-reference`}
          aria-labelledby={`${id}-tab-reference`}
          hidden={tab !== "reference"}
          sx={{
            display: tab === "reference" ? "flex" : "none",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          {reference({ headingId, hideHeading: true })}
        </Box>
      </Box>
    );
  }

  const docked = placement === "docked";
  // Without room, Reference opens over the world from a toggle at the end of
  // the breadcrumb row.
  const toggle = docked ? null : (
    <Button
      ref={toggleRef}
      size="small"
      color="inherit"
      startIcon={<ReferenceIcon />}
      aria-expanded={referenceOpen}
      aria-controls={panelId}
      onClick={() => {
        if (referenceOpen) {
          setReferenceOpen(false);
        } else {
          setReferenceOpen(true);
          requestAnimationFrame(() => closeButtonRef.current?.focus());
        }
      }}
    >
      {t("game.reference", "Reference")}
    </Button>
  );

  return (
    <Box
      ref={pageRef}
      sx={{
        position: "relative",
        flexGrow: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: docked
          ? `minmax(0, 1fr) ${WORLD_REFERENCE_WIDTH}px`
          : "minmax(0, 1fr)",
      }}
    >
      <Box
        sx={(theme) => ({
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          borderLeft: `1px solid ${theme.palette.divider}`,
          borderRight: `1px solid ${theme.palette.divider}`,
        })}
      >
        <WorldViewHeaderActionContext.Provider value={toggle}>
          {world}
        </WorldViewHeaderActionContext.Provider>
      </Box>

      <Paper
        id={panelId}
        role={docked ? undefined : "region"}
        aria-labelledby={headingId}
        square
        elevation={docked ? 0 : 8}
        hidden={!docked && !referenceOpen}
        onKeyDown={(event) => {
          if (!docked && event.key === "Escape") {
            event.stopPropagation();
            closeReference();
          }
        }}
        sx={(theme) => ({
          bgcolor: "background.default",
          display: docked || referenceOpen ? "flex" : "none",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          borderRight: `1px solid ${theme.palette.divider}`,
          ...(docked
            ? { gridColumn: 2, gridRow: 1 }
            : {
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                width: WORLD_REFERENCE_WIDTH,
                maxWidth: "100%",
                zIndex: theme.zIndex.appBar - 1,
                borderLeft: `1px solid ${theme.palette.divider}`,
              }),
        })}
      >
        {reference({
          headingId,
          headingAction: docked ? undefined : (
            <Tooltip title={t("worlds.page.hide-reference", "Hide Reference")}>
              <IconButton
                ref={closeButtonRef}
                aria-label={t("worlds.page.hide-reference", "Hide Reference")}
                onClick={closeReference}
                size="small"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          ),
        })}
      </Paper>
    </Box>
  );
}
