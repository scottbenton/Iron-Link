export function useIsLocalEnvironment() {
  return import.meta.env.DEV;
}
