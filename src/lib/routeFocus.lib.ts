import {
  getWorldViewPath,
  parseWorldViewPath,
} from "components/worlds/worldNavigation";

// Moving between these paths is moving within one page, not to a new one:
// a game's overview, character sheets and Add Character share the game's
// tabs and columns, and every section of a world entry (Details, Places,
// Map) is a tab of the entry.
export function getRouteFocusKey(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";

  const game = path.match(/^\/games\/([^/]+)(\/.*)?$/);
  if (game && game[1] !== "create") {
    return game[2] === "/display" ? path : `/games/${game[1]}`;
  }

  const world = parseWorldViewPath(path);
  if (world) {
    const { worldId, view } = world;
    return getWorldViewPath(
      worldId,
      view.type === "entry" ? { ...view, section: undefined } : view,
    );
  }

  return path;
}

// Whether a route change should move focus to the new page's start: always
// for a new page, and within a page only when the focused control went away
// with the old content (the browser then drops focus to the body).
export function shouldMoveFocusOnRouteChange(
  previousPathname: string,
  pathname: string,
  focusLost: boolean,
) {
  if (previousPathname === pathname) return false;
  return (
    focusLost ||
    getRouteFocusKey(previousPathname) !== getRouteFocusKey(pathname)
  );
}
