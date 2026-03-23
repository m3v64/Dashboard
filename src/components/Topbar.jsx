import { Search, RefreshCw, Bell } from "lucide-react"

function StatusPill({ color, label, value }) {
  const colorMap = {
    emerald: "bg-emerald-400",
    red: "bg-red-400",
    amber: "bg-amber-400",
  }
  return (
    <span className="flex items-center gap-1.5 text-gray-400">
      <span className={`w-1.5 h-1.5 rounded-full ${colorMap[color]}`} />
      {label} <span className="text-white">{value}</span>
    </span>
  )
}

export default function Topbar({ searchQuery, onSearchChange, autoRefresh, onAutoRefreshToggle, stats = {}, containerCount = 0 }) {
  const memPercent = stats.totalMemoryLimitMB ? ((stats.totalMemoryMB / stats.totalMemoryLimitMB) * 100).toFixed(0) : 0

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b border-white/5"
      style={{
        background: "rgba(10,12,18,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Status summary */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
          <StatusPill color="emerald" label="RUNNING" value={stats.running ?? 0} />
          <StatusPill color="red" label="STOPPED" value={stats.stopped ?? 0} />
          <StatusPill color="amber" label="UNHEALTHY" value={stats.unhealthy ?? 0} />
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-4" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
          <span className="text-gray-500">
            CPU <span className="text-cyan-500">{stats.avgCpu ?? 0}%</span>
          </span>
          <span className="text-gray-500">
            MEM <span className="text-purple-500">{memPercent}%</span>
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search containers..."
            className="pl-8 pr-3 py-1.5 rounded outline-none transition-colors bg-white/3 border border-white/6 text-gray-300 placeholder-gray-600 focus:border-cyan-500/30"
            style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px", width: "200px" }}
          />
        </div>

        <button
          onClick={onAutoRefreshToggle}
          className={`p-2 rounded transition-all cursor-pointer ${
            autoRefresh ? "bg-cyan-500/10 text-cyan-500" : "text-gray-600 hover:text-gray-400"
          }`}
          title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
        >
          <RefreshCw
            className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
            style={autoRefresh ? { animationDuration: "3s" } : {}}
          />
        </button>

        <button className="relative p-2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          {(stats.unhealthy ?? 0) > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  )
}
