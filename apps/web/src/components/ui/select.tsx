import * as React from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  items: Array<{ value: string; label: string }>;
  registerItem: (item: { value: string; label: string }) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

export function Select({ value, onValueChange, disabled, children }: { value: string; onValueChange: (value: string) => void; disabled?: boolean; children: React.ReactNode }) {
  const [items, setItems] = React.useState<Array<{ value: string; label: string }>>([]);
  const registerItem = React.useCallback((item: { value: string; label: string }) => {
    setItems((current) => (current.some((existing) => existing.value === item.value) ? current : [...current, item]));
  }, []);

  return <SelectContext.Provider value={{ value, onValueChange, disabled, items, registerItem }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  const context = React.useContext(SelectContext);
  if (!context) return null;
  return (
    <select
      className={cn("flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100", className)}
      value={context.value}
      onChange={(event) => context.onValueChange(event.target.value)}
      disabled={context.disabled}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectValue) {
          return <option value="">{child.props.placeholder ?? "Select an option"}</option>;
        }
        return null;
      })}
      {context.items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <>{placeholder}</>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const context = React.useContext(SelectContext);
  React.useEffect(() => {
    context?.registerItem({ value, label: String(children) });
  }, [context, value, children]);
  return null;
}
