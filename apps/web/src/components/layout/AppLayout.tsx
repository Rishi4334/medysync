import { useState } from "react";
import { useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [location] = useLocation();

  const pageTitle = title ?? (location === "/dashboard" ? "Dashboard" : "MedCare");

  return (
    <div className="min-h-screen bg-background md:flex">
      <div className="hidden md:block md:shrink-0">
        <Sidebar className="h-screen w-64" />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            className="absolute inset-0 bg-black/45"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[82vw] max-w-[320px]">
            <Sidebar className="h-full w-full" onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 border-b bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between gap-3">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-foreground"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="truncate text-base font-semibold text-foreground">{pageTitle}</h1>
          </div>
        </div>

        {title && (
          <div className="hidden border-b bg-white px-6 py-5 md:block lg:px-8">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
        )}

        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
