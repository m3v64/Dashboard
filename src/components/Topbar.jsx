import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router"
import { Search, RefreshCw, Bell, Menu, X } from "lucide-react"
import { REFRESH_OPTIONS } from "../context/DashboardContext"

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

export default function Topbar({ searchQuery, onSearchChange, refreshInterval, onIntervalChange, stats = {}, containers = [], hosts = [], onMenuToggle }) {
  const linuxHost = hosts.find(h => h.id === 'linux')
  const windowsHost = hosts.find(h => h.id === 'windows')
  const autoRefresh = refreshInterval !== null

  const navigate = useNavigate()
  const [focused, setFocused] = useState(false)
  const [refreshOpen, setRefreshOpen] = useState(false)
  const wrapperRef = useRef(null)
  const refreshRef = useRef(null)

  const results = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return containers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.image.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [searchQuery, containers])

  const showDropdown = focused && searchQuery.trim().length > 0

  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false)
      }
      if (refreshRef.current && !refreshRef.current.contains(e.target)) {
        setRefreshOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div
      className="flex items-center justify-between px-3 py-3 border-b border-white/5"
      style={{
        background: "rgba(10,12,18,0.9)",
        backdropFilter: "blur(12px)",
      }}
    >

      <div className="flex md:hidden">
        <button onClick={onMenuToggle} className="cursor-pointer">
          <Menu className="w-7 h-7" color="#4a5565" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="md:flex hidden items-center gap-4 " style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
          <StatusPill color="emerald" label="RUNNING" value={stats.running ?? 0} />
          <StatusPill color="red" label="STOPPED" value={stats.stopped ?? 0} />
          <StatusPill color="amber" label="UNHEALTHY" value={stats.unhealthy ?? 0} />
        </div>
        <div className="md:flex hidden h-4 w-px bg-white/10" />
        <div className="flex items-center gap-2" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
          <span className="text-gray-500 flex flex-col">
            <span><span className="inline text-gray-600">WIN </span>CPU <span className="text-cyan-500">{Math.round(windowsHost?.cpuUsage ?? 0)}%</span></span>
            <span><span className="inline text-gray-600">RPI </span>CPU <span className="text-cyan-500">{Math.round(linuxHost?.cpuUsage ?? 0)}%</span></span>
          </span>
          <span className="text-gray-500 flex flex-col">
            <span><span className="inline text-gray-600">WIN </span>MEM <span className="text-purple-500">{windowsHost?.memPercent ?? 0}%</span></span>
            <span><span className="inline text-gray-600">RPI </span>MEM <span className="text-purple-500">{linuxHost?.memPercent ?? 0}%</span></span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative" ref={wrapperRef}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search containers..."
            className="pl-8 pr-8 py-1.5 rounded outline-none transition-colors bg-white/3 border border-white/6 text-gray-300 placeholder-gray-600 focus:border-cyan-500/30"
            style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px", width: "200px" }}
          />
          {searchQuery && (
            <button
              onClick={() => { onSearchChange(""); setFocused(false) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-1 w-80 max-h-80 overflow-y-auto rounded-lg border border-white/8 z-150 shadow-xl"
              style={{
                background: "linear-gradient(135deg, rgba(12,14,22,0.98) 0%, rgba(8,10,16,0.98) 100%)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="px-3 py-2 border-b border-white/5">
                <span className="text-gray-500" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                  {results.length} RESULT{results.length !== 1 ? "S" : ""}
                </span>
              </div>

              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}>
                  No containers found
                </div>
              ) : (
                results.map((c) => {
                  const statusColor = c.status === "running" ? "#34d399" : c.status === "unhealthy" ? "#fbbf24" : "#f87171"
                  return (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/3 last:border-b-0"
                      onClick={() => {
                        navigate(`/containers/${encodeURIComponent(c.id)}`)
                        setFocused(false)
                        onSearchChange("")
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                        <span className="text-gray-200 truncate" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                          {c.name}
                        </span>
                        <span className="ml-auto text-cyan-500 shrink-0" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                          {c.cpuPercent}%
                        </span>
                      </div>
                      <div className="mt-0.5 text-gray-600 truncate pl-3.5" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                        {c.image}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>

        <div className="relative md:flex hidden" ref={refreshRef}>
          <button
            onClick={() => setRefreshOpen(!refreshOpen)}
            className={`flex items-center gap-1.5 p-2 rounded transition-all cursor-pointer ${autoRefresh ? "bg-cyan-500/10 text-cyan-500" : "text-gray-600 hover:text-gray-400"}`}
            title={autoRefresh ? `Refresh every ${refreshInterval / 1000}s` : "Auto-refresh OFF"}
          >
            <RefreshCw
              className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`}
              style={autoRefresh ? { animationDuration: "3s" } : {}}
            />
            {autoRefresh && (
              <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                {refreshInterval / 1000}s
              </span>
            )}
          </button>

          {refreshOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-32 rounded-lg border border-white/8 z-50 shadow-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(12,14,22,0.98) 0%, rgba(8,10,16,0.98) 100%)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="px-3 py-1.5 border-b border-white/5">
                <span className="text-gray-500" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                  REFRESH RATE
                </span>
              </div>
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => { onIntervalChange(opt.value); setRefreshOpen(false) }}
                  className={`w-full text-left px-3 py-2 transition-colors cursor-pointer border-b border-white/3 last:border-b-0 ${
                    refreshInterval === opt.value
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                  }`}
                  style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "11px" }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="md:flex hidden relative p-2 text-gray-600 hover:text-gray-400 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          {(stats.unhealthy ?? 0) > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  )
}
