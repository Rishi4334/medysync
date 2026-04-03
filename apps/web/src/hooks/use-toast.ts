import { toast as sonnerToast } from "sonner";

export type ToastAction = unknown;

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastOptions) => {
      const message = description ? `${title ?? ""} ${description}`.trim() : title ?? "";
      if (variant === "destructive") {
        sonnerToast.error(message || "Something went wrong");
      } else {
        sonnerToast(message || "Done");
      }
    },
  };
}
