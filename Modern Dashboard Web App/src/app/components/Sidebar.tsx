import {
  LayoutDashboard,
  Container,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hexagon,
  Network,
  HardDrive,
  Bell,
} from "lucide-react";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "containers", icon: Container, label: "Containers" },
  { id: "metrics", icon: Activity, label: "Metrics" },
  { id: "network", icon: Network, label: "Network" },
  { id: "storage", icon: HardDrive, label: "Storage" },
  { id: "alerts", icon: Bell, label: "Alerts" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export function Sidebar({ collapsed, onToggle, activeView, onViewChange, darkMode }) {
  return (
    <div
      className={`relative flex flex-col h-full transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      }`}
      style={{
        background: darkMode
          ? "linear-gradient(180deg, rgba(10,12,18,0.98) 0%, rgba(8,10,16,0.95) 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%)",
        borderRight: darkMode ? "1px solid rgba(0,240,255,0.08)" : "1px solid #e2e5ea",
      }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2 px-4 py-5 border-b ${darkMode ? "border-white/5" : "border-gray-200"}`}>
        <Hexagon className="w-7 h-7 text-cyan-400 shrink-0" strokeWidth={1.5} />
        {!collapsed && (
          <span
            className={`tracking-[0.2em] uppercase ${darkMode ? "text-cyan-300" : "text-cyan-600"}`}
            style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "14px" }}
          >
            PRISM//OS
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200 group cursor-pointer ${
                isActive
                  ? darkMode
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "bg-cyan-500/10 text-cyan-700"
                  : darkMode
                  ? "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              style={{ fontFamily: "Rajdhani, sans-serif" }}
            >
              <Icon
                className={`w-[18px] h-[18px] shrink-0 transition-all ${
                  isActive ? "drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]" : ""
                }`}
                strokeWidth={1.5}
              />
              {!collapsed && (
                <span className="tracking-wide uppercase" style={{ fontSize: "13px" }}>
                  {item.label}
                </span>
              )}
              {isActive && (
                <div
                  className="absolute left-0 w-[2px] h-6 bg-cyan-400 rounded-r"
                  style={{ boxShadow: "0 0 8px rgba(0,240,255,0.6)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-cyan-400 transition-all cursor-pointer z-10 ${
          darkMode
            ? "bg-gray-900 border border-cyan-500/20 hover:bg-cyan-500/10"
            : "bg-white border border-gray-300 hover:bg-gray-50 shadow-sm"
        }`}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Bottom accent */}
      <div className={`px-4 py-3 border-t ${darkMode ? "border-white/5" : "border-gray-200"}`}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {!collapsed && (
            <span className={darkMode ? "text-gray-600" : "text-gray-400"} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
              SYS.ONLINE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
