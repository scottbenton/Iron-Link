import { useEffect, useRef, useState } from "react";

export interface WorldConfigurationDeleteRequest {
  title: string;
  description: string;
  confirmationText: string;
}

export function useWorldConfigurationDeleteConfirmation() {
  const [request, setRequest] = useState<WorldConfigurationDeleteRequest>();
  const resolveRef = useRef<
    ((result: { confirmed: boolean }) => void) | undefined
  >(undefined);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      resolveRef.current?.({ confirmed: false });
      resolveRef.current = undefined;
    };
  }, []);
  const answer = (confirmed: boolean) => {
    resolveRef.current?.({ confirmed });
    resolveRef.current = undefined;
    if (mounted.current) setRequest(undefined);
  };
  const confirm = (next: WorldConfigurationDeleteRequest) =>
    new Promise<{ confirmed: boolean }>((resolve) => {
      if (!mounted.current) {
        resolve({ confirmed: false });
        return;
      }
      resolveRef.current?.({ confirmed: false });
      resolveRef.current = resolve;
      setRequest(next);
    });
  return { confirm, request, answer };
}
