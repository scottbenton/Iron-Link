import { ToastApi, toast } from "./toast";

/** The toast API (the same object as `toast`), for components. */
export function useToast(): ToastApi {
  return toast;
}
