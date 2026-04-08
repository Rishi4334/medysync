import { Link, useLocation } from "wouter";
import { getCurrentUser, clearCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Pill,
  Bell,
  Activity,
  Cpu,
  BarChart3,
  Settings,
  LogOut,
  Heart,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "caretaker", "patient"] },
  { href: "/patients", label: "Patients", icon: Users, roles: ["admin", "caretaker"] },
  { href: "/caretakers", label: "Caretakers", icon: UserCheck, roles: ["admin"] },
  { href: "/medicines", label: "Medicines", icon: Pill, roles: ["admin", "caretaker", "patient"] },
  { href: "/reminders", label: "Reminders", icon: Bell, roles: ["admin", "caretaker", "patient"] },
  { href: "/events", label: "IoT Events", icon: Activity, roles: ["admin", "caretaker", "patient"] },
  { href: "/devices", label: "Devices", icon: Cpu, roles: ["admin", "caretaker"] },
  { href: "/adherence", label: "Adherence", icon: BarChart3, roles: ["admin", "caretaker", "patient"] },
  { href: "/users", label: "Users", icon: Settings, roles: ["admin"] },
];

export function Sidebar({ className = "", onNavigate }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const user = getCurrentUser();

  function handleLogout() {
    clearCurrentUser();
    setLocation("/login");
  }

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    admin: "text-yellow-400",
    caretaker: "text-teal-400",
    patient: "text-blue-400",
  };

  return (
    <aside className={`flex flex-col ${className}`} style={{ background: "hsl(213 35% 14%)" }}>
      <div className="border-b px-6 py-5" style={{ borderColor: "hsl(213 30% 20%)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "hsl(185 75% 40%)" }}>
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">MedCare</span>
            <div className="text-xs" style={{ color: "hsl(185 75% 60%)" }}>Patient Care System</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive ? "border-l-2 text-white" : "hover:text-white"}`}
              style={isActive ? { background: "hsl(213 30% 22%)", borderColor: "hsl(185 75% 45%)", color: "hsl(185 75% 70%)" } : { color: "hsl(210 20% 65%)" }}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="border-t px-4 py-4" style={{ borderColor: "hsl(213 30% 20%)" }}>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold" style={{ background: "hsl(185 75% 30%)", color: "hsl(185 75% 85%)" }}>
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user.name}</div>
              <div className={`text-xs capitalize font-medium ${roleColors[user.role] ?? "text-gray-400"}`}>
                <ShieldCheck className="mr-1 inline h-3 w-3" />
                {user.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:text-white"
            style={{ color: "hsl(210 20% 55%)" }}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
