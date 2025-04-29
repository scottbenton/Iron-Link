import { useIsScreen } from "@/hooks/useIsScreen";
import {
  CardBody,
  CardBodyProps,
  CardRoot,
  CardRootProps,
} from "@chakra-ui/react";

export interface MobileOnlyTabPanelProps<TabType> extends CardRootProps {
  currentOpenTab: TabType;
  tab: TabType;
  cardBodyProps?: CardBodyProps;
}

export function MobileOnlyTabPanel<T>(props: MobileOnlyTabPanelProps<T>) {
  const { currentOpenTab, tab, children, cardBodyProps, ...cardRootProps } =
    props;

  const isSmallScreen = useIsScreen("smaller-than", "md");

  return (
    <CardRoot
      display={{ base: currentOpenTab === tab ? "flex" : "none", md: "flex" }}
      role={isSmallScreen ? "tabpanel" : undefined}
      id={`tabpanel-${tab}`}
      aria-labelledby={isSmallScreen ? `tab-${tab}` : undefined}
      flexDir={"column"}
      overflow="hidden"
      flexGrow={1}
      borderBottomRadius={{ base: 0, md: "md" }}
      {...cardRootProps}
    >
      <CardBody overflow={"auto"} {...cardBodyProps}>
        {children}
      </CardBody>
    </CardRoot>
  );
}
