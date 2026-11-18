import { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

import { ToastCard, ToastTone } from "./ToastCard";
import { announceToast } from "./toastAnnouncements";

export interface ToastAction {
  label: string;
  onClick: () => void;
  /** Keep the toast after the action runs. By default it closes. */
  keepOpen?: boolean;
}

export interface ToastOptions {
  /** Reuse an id to replace a toast that is still open. */
  id?: string;
  description?: ReactNode;
  /** A button such as Undo. */
  action?: ToastAction;
  /**
   * What a screen reader hears; defaults to the message (and a string
   * description). Pass `false` to stay silent, for example when an open
   * dialog announces it instead through `useDialogAnnounce()`.
   */
  announcement?: string | false;
  dismissLabel?: string;
  /** Allow a swipe to dismiss, as well as the Dismiss button. */
  swipeToDismiss?: boolean;
  /** Runs however the toast closes. */
  onDismiss?: () => void;
}

export interface ToastControls {
  id: string;
  dismiss: () => void;
}

export interface CustomToastOptions {
  id?: string;
  /** What a screen reader hears. A custom toast is silent without one. */
  announcement?: string;
  swipeToDismiss?: boolean;
  onDismiss?: () => void;
}

export interface PromiseToastMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

let nextId = 0;
const openIds = new Set<string>();

function createId() {
  nextId += 1;
  return `ui-toast-${nextId}`;
}

function dismiss(id: string) {
  sonnerToast.dismiss(id);
}

function dismissAll() {
  sonnerToast.dismiss();
}

function custom(
  render: (controls: ToastControls) => ReactNode,
  options: CustomToastOptions = {},
): string {
  const id = options.id ?? createId();
  const controls: ToastControls = { id, dismiss: () => dismiss(id) };
  openIds.add(id);
  sonnerToast.custom(() => <>{render(controls)}</>, {
    id,
    duration: Infinity,
    dismissible: options.swipeToDismiss ?? false,
    onDismiss: () => {
      openIds.delete(id);
      options.onDismiss?.();
    },
  });
  if (options.announcement) announceToast(options.announcement);
  return id;
}

function show(tone: ToastTone, message: string, options: ToastOptions = {}) {
  const { description, action, announcement, dismissLabel } = options;
  const spoken =
    announcement === false
      ? undefined
      : (announcement ??
        (typeof description === "string" && description
          ? `${message}. ${description}`
          : message));
  return custom(
    ({ dismiss: close }) => (
      <ToastCard
        tone={tone}
        message={message}
        description={description}
        dismissLabel={dismissLabel}
        onDismiss={close}
        action={
          action && {
            label: action.label,
            onClick: () => {
              action.onClick();
              if (!action.keepOpen) close();
            },
          }
        }
      />
    ),
    {
      id: options.id,
      announcement: spoken,
      swipeToDismiss: options.swipeToDismiss,
      onDismiss: options.onDismiss,
    },
  );
}

/**
 * Shows a loading toast, then replaces it with the result when the promise
 * settles. If the person dismissed it meanwhile, a success stays quiet but
 * an error still shows. Returns the original promise.
 */
function promise<T>(
  work: Promise<T>,
  messages: PromiseToastMessages<T>,
  options: Omit<ToastOptions, "action"> = {},
): Promise<T> {
  const id = show("loading", messages.loading, options);
  work.then(
    (data) => {
      if (!openIds.has(id)) return;
      const text =
        typeof messages.success === "function"
          ? messages.success(data)
          : messages.success;
      show("success", text, { ...options, id });
    },
    (error: unknown) => {
      const text =
        typeof messages.error === "function"
          ? messages.error(error)
          : messages.error;
      show("error", text, openIds.has(id) ? { ...options, id } : options);
    },
  );
  return work;
}

export interface ToastApi {
  info: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  /** Errors stay until dismissed, like every toast here. */
  error: (message: string, options?: ToastOptions) => string;
  /** A spinner toast; replace it by calling another method with its id. */
  loading: (message: string, options?: ToastOptions) => string;
  promise: typeof promise;
  custom: typeof custom;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

/**
 * Toasts, callable from anywhere (stores and services included); `useToast()`
 * returns the same object. Nothing dismisses itself: every toast has a
 * Dismiss button, and the Toaster offers Clear All when several are open.
 * Each toast is announced once through `useAnnounce()`; Sonner's own live
 * region is switched off so nothing is read twice.
 *
 * While a modal dialog is open, the page's live region may be hidden from
 * screen readers. A dialog that stays open after the action should announce
 * through its own region and keep the toast silent:
 *
 * ```ts
 * const dialogAnnounce = useDialogAnnounce();
 * toast.success("Asset added", { announcement: dialogAnnounce ? false : undefined });
 * dialogAnnounce?.("Asset added");
 * ```
 */
export const toast: ToastApi = {
  info: (message, options) => show("info", message, options),
  success: (message, options) => show("success", message, options),
  warning: (message, options) => show("warning", message, options),
  error: (message, options) => show("error", message, options),
  loading: (message, options) => show("loading", message, options),
  promise,
  custom,
  dismiss,
  dismissAll,
};
