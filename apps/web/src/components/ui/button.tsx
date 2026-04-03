import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", ...props },
  ref,
) {
  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    default: "bg-teal-600 text-white hover:bg-teal-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 px-3 rounded-md text-sm",
    lg: "h-11 px-6 rounded-lg",
    icon: "h-10 w-10",
  };

  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
