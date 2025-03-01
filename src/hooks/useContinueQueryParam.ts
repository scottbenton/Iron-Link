import { useSearchParams } from "wouter";

export function useContinueQueryParam() {
  const [urlParams] = useSearchParams();

  return urlParams.get("continue");
}
