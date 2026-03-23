import { Search, RefreshCw, Bell, Moon, Sun } from "lucide-react";
import { runningCount, stoppedCount, unhealthyCount, totalCpu, totalMemoryMB, totalMemoryLimitMB, containers } from "./mock-data";

export function Topbar({ searchQuery, onSearchChange, autoRefresh, onAutoRefreshToggle, darkMode, onDarkModeToggle }) {
  const memPercent = ((totalMemoryMB / totalMemoryLimitMB) * 100).toFixed(0);
  const avgCpu = (totalCpu / containers.length).toFixed(1);

  return (
    <div
      className={`flex items-center justify-between px-6 py-3 border-b ${darkMode ? "border-white/5" : "border-gray-200"}`}
      style={{
        background: darkMode ? "rgba(10,12,18,0.9)" : "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left: Status summary */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
          <StatusPill color="emerald" label="RUNNING" value={runningCount} darkMode={darkMode} />
          <StatusPill color="red" label="STOPPED" value={stoppedCount} darkMode={darkMode} />
          <StatusPill color="amber" label="UNHEALTHY" value={unhealthyCount} darkMode={darkMode} />
        </div>
        <div className={`h-4 w-px ${darkMode ? "bg-white/10" : "bg-gray-200"}`} />
        <div className="flex items-center gap-4" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
          <span className="text-gray-500">
            CPU <span className="text-cyan-500">{avgCpu}%</span>
          </span>
          <span className="text-gray-500">
            MEM <span className="text-purple-500">{memPercent}%</span>
          </span>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search containers..."
            className={`pl-8 pr-3 py-1.5 rounded outline-none transition-colors ${
              darkMode
                ? "bg-white/[0.03] border border-white/[0.06] text-gray-300 placeholder-gray-600 focus:border-cyan-500/30"
                : "bg-gray-100 border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-cyan-500/50"
            }`}
            style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px", width: "200px" }}
          />
        </div>

        <button
          onClick={onAutoRefreshToggle}
          className={`p-2 rounded transition-all cursor-pointer ${
            autoRefresh
              ? "bg-cyan-500/10 text-cyan-500"
              : darkMode
              ? "text-gray-600 hover:text-gray-400"
              : "text-gray-400 hover:text-gray-600"
          }`}
          title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
        >
          <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} style={autoRefresh ? { animationDuration: "3s" } : {}} />
        </button>

        <button className={`relative p-2 transition-colors cursor-pointer ${darkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`}>
          <Bell className="w-4 h-4" />
          {unhealthyCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={onDarkModeToggle}
          className={`p-2 transition-colors cursor-pointer ${darkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"}`}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function StatusPill({ color, label, value, darkMode }) {
  const colorMap = {
    emerald: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
  };
  return (
    <span className={`flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap[color]}`} />
      {label} <span className={darkMode ? "text-white" : "text-gray-800"}>{value}</span>
    </span>
  );
}
