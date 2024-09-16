import {
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export function useDebouncedSync<State>(
  persistChanges: (state: State) => void,
  initialState: State,
  delay = 2000
): [State, (value: SetStateAction<State>) => void] {
  const [state, setState] = useState<State>(initialState);
  const stateRef = useRef<State>(state);

  const lastUpdateState = useRef<State>(initialState);

  useEffect(() => {
    // Make sure we don't have unsaved changes
    if (stateRef.current === lastUpdateState.current) {
      setState(initialState);
      stateRef.current = initialState;
      lastUpdateState.current = initialState;
    }
  }, [initialState]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (
        (state !== undefined || state !== null) &&
        state !== lastUpdateState.current
      ) {
        lastUpdateState.current = state;
        persistChanges(state);
      }
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, delay]);

  useEffect(() => {
    return () => {
      if (stateRef.current !== lastUpdateState.current) {
        persistChanges(stateRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStateCallback = useCallback((newState: SetStateAction<State>) => {
    if (typeof newState === "function") {
      setState((prevState) => {
        const newStateValue = (newState as (prevState: State) => State)(
          prevState
        );
        stateRef.current = newStateValue;
        return newStateValue;
      });
    } else {
      setState(newState);
      stateRef.current = newState;
    }
  }, []);

  return [state, setStateCallback];
}
