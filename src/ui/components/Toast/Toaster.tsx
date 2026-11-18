import { Toaster as SonnerToaster } from "sonner";

/**
 * Where toasts render. Placeholder until the Toast component lands: nothing
 * dismisses itself, and each toast renders the library's own element.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      duration={Infinity}
      visibleToasts={5}
      gap={8}
      toastOptions={{ unstyled: true }}
    />
  );
}
