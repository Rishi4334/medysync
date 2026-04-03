import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactElement }) {
  const context = React.useContext(DialogContext);
  if (!context) return children;
  if (asChild) {
    return React.cloneElement(children, {
      onClick: (event: React.MouseEvent) => {
        children.props.onClick?.(event);
        context.setOpen(true);
      },
    });
  }
  return <button onClick={() => context.setOpen(true)}>{children}</button>;
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(DialogContext);
  if (!context?.open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={() => context.setOpen(false)} aria-label="Close dialog" />
      <div className={cn("relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl", className)}>
        <button className="absolute right-4 top-4 rounded-full p-1 text-slate-500 hover:bg-slate-100" onClick={() => context.setOpen(false)} aria-label="Close dialog">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("space-y-2 pr-8", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-xl font-semibold text-slate-900", className)}>{children}</h2>;
}
