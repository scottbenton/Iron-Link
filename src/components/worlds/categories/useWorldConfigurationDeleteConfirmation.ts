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
  useEffect(
    () => () => {
      resolveRef.current?.({ confirmed: false });
    },
    [],
  );
  const answer = (confirmed: boolean) => {
    resolveRef.current?.({ confirmed });
    resolveRef.current = undefined;
    setRequest(undefined);
  };
  const confirm = (next: WorldConfigurationDeleteRequest) =>
    new Promise<{ confirmed: boolean }>((resolve) => {
      resolveRef.current?.({ confirmed: false });
      resolveRef.current = resolve;
      setRequest(next);
    });
  return { confirm, request, answer };
}
