import { useEffect, useState } from "react";

export function useDebounceValue<State>(
  value: State,
  delay = 2000,
): {
  value: State;
  isSynced: boolean;
} {
  const [debouncedValue, setDebouncedValue] = useState<State>(value);

  useEffect(() => {
    let shouldUpdate = true;
    const timeout = setTimeout(() => {
      if (!shouldUpdate) {
        return;
      }
      setDebouncedValue(value);
    }, delay);

    return () => {
      shouldUpdate = false;
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return { value: debouncedValue, isSynced: value === debouncedValue };
}
