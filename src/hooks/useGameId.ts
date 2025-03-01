import { useParams } from "wouter";

export function useGameId() {
    const gameId = useGameIdOptional();
    if (!gameId) {
        throw new Error("Game ID is required");
    }
    return gameId;
}

export function useGameIdOptional() {
    const { gameId } = useParams<{ gameId?: string }>();
    return gameId;
}
