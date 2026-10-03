/** Package hints used to find a world's linked rulesets and oracle catalogs. */
export function getWorldSettingPackageIds(settingKey: string | null): string[] {
  const packageId = settingKey?.includes(":")
    ? settingKey.split(":")[1]?.split("/")[0]
    : settingKey;
  if (!packageId) return [];
  return packageId === "sundered_isles"
    ? ["starforged", "sundered_isles"]
    : [packageId];
}
