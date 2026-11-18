import { Ref, RefCallback } from "react";

/** One ref callback that sets every given ref. */
export function mergeRefs<T>(
  ...refs: (Ref<T> | undefined | null)[]
): RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref) (ref as { current: T | null }).current = value;
    }
  };
}
