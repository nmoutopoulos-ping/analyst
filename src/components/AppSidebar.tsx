import { Building2, LayoutDashboard, FileBarChart, PieChart, Calculator, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Building2, label: "Properties" },
  { icon: PieChart, label: "Portfolio" },
  { icon: Calculator, label: "Underwriting" },
  { icon: FileBarChart, label: "Reports" },
];

const AppSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-secondary flex flex-col z-50">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <h1 className="text-lg font-semibold text-secondary-foreground tracking-tight">
          Analyst<span className="text-primary">CRE</span>
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors duration-100",
              item.active
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-sm transition-colors duration-100">
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
