import { useLocation } from "react-router";

export function useIsOnCharacterCreatePage() {
  const { pathname } = useLocation();
  return /\/games\/[^/]*\/create[/]?$/i.test(pathname);
}
