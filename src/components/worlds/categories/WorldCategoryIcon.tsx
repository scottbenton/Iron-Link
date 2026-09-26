import CategoryOutlined from "@mui/icons-material/CategoryOutlined";
import ExploreOutlined from "@mui/icons-material/ExploreOutlined";
import HolidayVillageOutlined from "@mui/icons-material/HolidayVillageOutlined";
import MapOutlined from "@mui/icons-material/MapOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import Public from "@mui/icons-material/Public";
import Sailing from "@mui/icons-material/Sailing";
import Terrain from "@mui/icons-material/Terrain";

import { IconDefinition } from "types/Icon.type";

const icons = {
  GiCompass: ExploreOutlined,
  GiPerson: PersonOutline,
  GiBookCover: MenuBookOutlined,
  GiVillage: HolidayVillageOutlined,
  GiPlanetCore: Public,
  GiSailboat: Sailing,
  GiMountain: Terrain,
  GiTreasureMap: MapOutlined,
};

export function WorldCategoryIcon({ icon }: { icon: IconDefinition | null }) {
  if (!icon?.key) return null;
  const Icon = icons[icon.key as keyof typeof icons] ?? CategoryOutlined;
  return (
    <Icon
      fontSize="small"
      sx={{ color: icon.color ?? "inherit", mr: 1, verticalAlign: "middle" }}
    />
  );
}
