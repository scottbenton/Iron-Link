import { useCallback, useRef, useState } from "react";

/**
 * State that a caller may control. When `controlled` is undefined the hook
 * keeps its own value, starting at `defaultValue`; either way `setValue`
 * reports the change through `onChange`. `null` counts as controlled, so a
 * controlled select can say "nothing chosen".
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (value: T) => void] {
  const [inner, setInner] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : inner;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );
  return [value, setValue];
}
