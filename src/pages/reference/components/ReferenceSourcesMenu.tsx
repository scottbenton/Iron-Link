import { useTranslation } from "react-i18next";

import { Button } from "ui/components/Button";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuTrigger,
} from "ui/components/Menu";
import { FunnelSimpleIcon } from "ui/icons";

import { ReferenceSection, ReferenceTab } from "../data/referenceTabs";
import {
  isSourceChecked,
  isSourceShown,
  useReferenceSettings,
} from "../stores/referenceSettings.store";

export interface ReferenceSourcesMenuProps {
  tab: ReferenceTab;
  section: ReferenceSection;
}

// The tab's Sources filter: which expansions show in its lists. It filters
// the lists only, so links to a hidden item still open.
export function ReferenceSourcesMenu(props: ReferenceSourcesMenuProps) {
  const { tab, section } = props;
  const { t } = useTranslation();

  const overrides = useReferenceSettings(
    (state) => state.sourceVisibility[tab.id],
  );
  const setSourceVisible = useReferenceSettings(
    (state) => state.setSourceVisible,
  );

  const sources = tab.sources.filter(
    (source) => !source.sections || source.sections.includes(section),
  );

  if (sources.length === 0) return null;

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            startIcon={<FunnelSimpleIcon />}
          />
        }
      >
        {t("reference.sources.button", "Sources")}
      </MenuTrigger>
      <MenuContent align="end">
        {sources.map((source) => {
          const checked = isSourceChecked(source, overrides);
          // A source whose dependency is off stays ticked but can't show.
          const blocked = checked && !isSourceShown(tab, source, overrides);
          const dependencyLabels = (source.dependsOn ?? [])
            .map((key) => tab.sources.find((s) => s.key === key)?.label)
            .filter((label): label is string => !!label);
          return (
            <MenuCheckboxItem
              key={source.key}
              checked={checked}
              onCheckedChange={(next) =>
                setSourceVisible(tab.id, source.key, next)
              }
              description={
                blocked
                  ? t(
                      "reference.sources.needs",
                      "Shows when {{sources}} is on",
                      { sources: dependencyLabels.join(", ") },
                    )
                  : undefined
              }
            >
              {source.label}
            </MenuCheckboxItem>
          );
        })}
      </MenuContent>
    </Menu>
  );
}
