import { useParams } from "react-router";

export function useGameId() {
  const { gameId } = useParams<{ gameId: string }>();
  if (!gameId) {
    throw new Error("No gameId found in route");
  }

  return gameId;
}

export function useGameIdOptional() {
  const { gameId } = useParams<{ gameId: string }>();
  return gameId;
}
