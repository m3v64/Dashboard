import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router"
import {
  Search, Cpu, MemoryStick, HardDrive, Network, Server,
  ChevronRight, AlertTriangle, CheckCircle, XCircle, X, Star,
} from "lucide-react"
import { useDashboard } from "../context/DashboardContext"
import { PromQL, fmtMB } from "../Query"
import RangeChartCard from "./RangeChartCard"

function StatusBadge({ status }) {
  const config = {
    running: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "RUNNING" },
    unhealthy: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", label: "UNHEALTHY" },
    stopped: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", label: "STOPPED" },
  }
  const c = config[status] || config.stopped
  const Icon = c.icon
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${c.bg} ${c.color}`}
      style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
    >
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  )
}

function MiniStat({ label, value, icon: Icon, color, small }) {
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="p-2 rounded" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="text-gray-500 uppercase tracking-wider" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px" }}>
          {label}
        </div>
        <div className="text-white" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: small ? "14px" : "20px", fontWeight: 600, lineHeight: 1.2 }}>
          {value}
        </div>
      </div>
    </div>
  )
}

function UtilizationBar({ label, percent, color }) {
  return (
    <div>
      <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
        <span className="text-gray-500">{label}</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(percent, 100)}%`,
            background: percent > 80
              ? "linear-gradient(90deg, #f87171, #ef4444)"
              : `linear-gradient(90deg, ${color}, ${color}aa)`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
      </div>
    </div>
  )
}

const MB = 1024 * 1024

export default function ContainersPage({ containers = [] }) {
  const { containerId } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const { hosts, toggleFavorite, isFavorite } = useDashboard()


  const findHost = (container) => {
    if (!container || hosts.length === 0) return null
    const inst = (container.host || "").toLowerCase()

    for (const h of hosts) {
      const name = (h.name || "").toLowerCase()
      if (inst.includes(name) || name.includes(inst.replace(/:\d+$/, ""))) return h
    }

    const winHost = hosts.find((h) => h.id === "windows")
    const linHost = hosts.find((h) => h.id === "linux")
    if (inst.includes("192.168") && winHost) return winHost

    if (linHost && winHost && container.memoryMB > linHost.memTotalGB * 1024) return winHost

    return linHost || winHost || hosts[0] || null
  }

  const filtered = useMemo(() =>
    containers.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.image.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === "all" || c.status === filterStatus
      return matchesSearch && matchesStatus
    }).sort((a, b) => isFavorite(b.id) - isFavorite(a.id)),
    [containers, search, filterStatus, isFavorite]
  )

  const effectiveId = containerId ?? containers[0]?.id ?? null
  const selected = containers.find((c) => c.id === effectiveId)
  const selectedName = selected?.name

  const statusCounts = useMemo(() => ({
    all: containers.length,
    running: containers.filter((c) => c.status === "running").length,
    unhealthy: containers.filter((c) => c.status === "unhealthy").length,
    stopped: containers.filter((c) => c.status === "stopped").length,
  }), [containers])

  const statusFilters = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "running", label: "Running", count: statusCounts.running },
    { key: "unhealthy", label: "Unhealthy", count: statusCounts.unhealthy },
    { key: "stopped", label: "Stopped", count: statusCounts.stopped },
  ]

  const showDetail = !!containerId && !!selected

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      <div
        className="w-full md:w-[320px] shrink-0 flex flex-col h-full md:border-r overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,10,16,0.5)" }}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
            <span className="uppercase tracking-wider text-gray-300" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}>
              Containers
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter containers..."
              className="w-full pl-8 pr-3 py-1.5 rounded outline-none transition-colors bg-white/3 border border-white/6 text-gray-300 placeholder-gray-600 focus:border-cyan-500/30"
              style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}
            />
          </div>

          <div className="flex gap-1">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${filterStatus === f.key
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "text-gray-600 hover:text-gray-400"
                  }`}
                style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.map((c) => {
            const isSelected = effectiveId === c.id
            const statusDot = c.status === "running" ? "bg-emerald-400" : c.status === "unhealthy" ? "bg-amber-400" : "bg-red-400"

            return (
              <button
                key={c.id}
                onClick={() => navigate(`/containers/${encodeURIComponent(c.id)}`)}
                className={`w-full text-left rounded-lg p-3 mb-1 transition-all cursor-pointer ${isSelected
                  ? "bg-cyan-500/8 border border-cyan-500/20"
                  : "hover:bg-white/2 border border-transparent"
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${statusDot}`}
                      style={c.status === "unhealthy" ? { boxShadow: "0 0 6px rgba(251,191,36,0.5)" } : {}}
                    />
                    <span className="text-gray-200" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(c.id) }}
                      className="cursor-pointer hover:scale-110 transition-transform p-0.5"
                    >
                      <Star
                        className="w-3 h-3 transition-colors"
                        fill={isFavorite(c.id) ? "#facc15" : "none"}
                        stroke={isFavorite(c.id) ? "#facc15" : "#4b5563"}
                      />
                    </span>
                    <ChevronRight className={`w-3 h-3 transition-colors ${isSelected ? "text-cyan-400" : "text-gray-700"}`} />
                  </div>
                </div>

                <div className="text-gray-600 mb-2" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                  {c.image}
                </div>

                <div className="space-y-1.5">
                  {(() => {
                    const cHost = findHost(c)
                    const hostMemPct = cHost
                      ? parseFloat(((c.memoryMB / (cHost.memTotalGB * 1024)) * 100).toFixed(1))
                      : c.memoryPercent
                    return [
                      { label: "CPU", percent: c.cpuPercent, warn: c.cpuPercent > 80, color: "#00f0ff", warnColor: "text-red-400", okColor: "text-cyan-500" },
                      { label: "MEM", percent: hostMemPct, warn: hostMemPct > 80, color: "#a855f7", warnColor: "text-red-400", okColor: "text-purple-500" },
                    ]
                  })().map((bar) => (
                    <div key={bar.label} className="flex items-center gap-2">
                      <span className="w-8 text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px" }}>
                        {bar.label}
                      </span>
                      <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(bar.percent, 100)}%`, background: bar.warn ? "#f87171" : bar.color }}
                        />
                      </div>
                      <span
                        className={bar.warn ? bar.warnColor : bar.okColor}
                        style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px", width: "32px", textAlign: "right" }}
                      >
                        {bar.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            )
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
              No containers found
            </div>
          )}
        </div>
      </div>

      {showDetail && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => navigate("/containers")}
        />
      )}

      <div
        className={`
          fixed inset-0 z-50 overflow-y-auto p-6 transition-transform duration-300
          md:relative md:inset-auto md:z-auto md:flex-1 md:translate-x-0
          ${showDetail ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ background: "linear-gradient(135deg, #06080e 0%, #0a0c14 50%, #080a12 100%)" }}
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => navigate("/containers")}
                    className="md:hidden p-1 rounded hover:bg-white/5 text-gray-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="w-1 h-6 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
                  <h2 className="text-white" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "24px", fontWeight: 600 }}>
                    {selected.name}
                  </h2>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="ml-4 text-gray-500" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                  IMAGE: {selected.image} &nbsp;|&nbsp; HOST: {selected.host} &nbsp;|&nbsp; UPTIME: {selected.uptime}
                </div>
              </div>

              {(selected.cpuPercent > 80 || selected.memoryPercent > 80) && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-400/10 text-red-400"
                  style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  HIGH RESOURCE USAGE
                </div>
              )}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniStat label="CPU Usage" value={`${selected.cpuPercent}%`} icon={Cpu} color="#00f0ff" />
              <MiniStat label="Memory" value={`${selected.memoryMB}MB`} icon={MemoryStick} color="#a855f7" />
              <MiniStat label="Network I/O" value={`↓${fmtMB(selected.networkRxMB)} ↑${fmtMB(selected.networkTxMB)} MB/s`} icon={Network} color="#22d3ee" small />
              <MiniStat label="Disk I/O" value={`↓${fmtMB(selected.diskReadMB)} ↑${fmtMB(selected.diskWriteMB)} MB/s`} icon={HardDrive} color="#34d399" small />
            </div>

            {(() => {
              const containerHost = findHost(selected)
              if (!containerHost) return null
              return (
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,240,255,0.06)" }}
                >
                  <div className="flex items-center gap-2">
                    <Server className="w-3.5 h-3.5 text-cyan-500" />
                    <span className="uppercase tracking-wider text-gray-400" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
                      Host System — {containerHost.name}
                    </span>
                    <span className="ml-auto text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px" }}>
                      {containerHost.os} • {containerHost.cpuCores} cores • up {containerHost.uptime}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <UtilizationBar label={`HOST CPU (${containerHost.cpuCores} cores)`} percent={containerHost.cpuUsage} color="#00f0ff" />
                    <UtilizationBar label={`HOST RAM (${containerHost.memUsedGB} / ${containerHost.memTotalGB} GB)`} percent={containerHost.memPercent} color="#a855f7" />
                  </div>
                  {containerHost.filesystems.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {containerHost.filesystems.map((fs) => (
                        <UtilizationBar key={fs.mountpoint} label={`${fs.mountpoint} (${fs.usedGB} / ${fs.sizeGB} GB)`} percent={fs.usedPercent} color="#34d399" />
                      ))}
                    </div>
                  )}
                  {containerHost.temp != null && (
                    <div className="text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                      TEMP: <span className={containerHost.temp > 70 ? "text-red-400" : containerHost.temp > 55 ? "text-amber-400" : "text-emerald-400"}>{containerHost.temp}°C</span>
                      {containerHost.load1 != null && (
                        <span className="ml-4">LOAD: <span className="text-orange-400">{containerHost.load1}</span> / <span className="text-orange-300">{containerHost.load5}</span> / <span className="text-orange-200">{containerHost.load15}</span></span>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            <div
              className="rounded-lg p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="uppercase tracking-wider text-gray-400" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
                Container Resource Utilization
              </div>
              {(() => {
                const selHost = findHost(selected)
                return (<>
                  <UtilizationBar label={`CPU (${selected.cpuPercent}% of ${selHost?.cpuCores ?? '?'} host cores)`} percent={selected.cpuPercent} color="#00f0ff" />
                  <UtilizationBar label={`MEMORY (${selected.memoryMB}MB / ${selected.memoryLimit}MB limit)`} percent={selected.memoryPercent} color="#a855f7" />
                  {selHost && (
                    <UtilizationBar label={`MEMORY vs HOST (${selected.memoryMB}MB / ${(selHost.memTotalGB * 1024).toFixed(0)}MB total)`} percent={parseFloat(((selected.memoryMB / (selHost.memTotalGB * 1024)) * 100).toFixed(1))} color="#818cf8" />
                  )}
                  <UtilizationBar label="DISK I/O" percent={Math.min(((selected.diskReadMB + selected.diskWriteMB) / 300 * 100), 100).toFixed(1)} color="#34d399" />
                </>)
              })()}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RangeChartCard
                title="CPU Usage Over Time (%)"
                series={[{ query: selectedName ? PromQL.cpuRange(selectedName) : null, dataKey: "value", name: "CPU %", color: "#00f0ff", gradientId: "detailCpuGrad" }]}
                height={160}
                compact
              />
              <RangeChartCard
                title="Memory Usage Over Time (MB)"
                series={[{ query: selectedName ? PromQL.memoryRange(selectedName) : null, dataKey: "value", name: "Memory MB", color: "#a855f7", gradientId: "detailMemGrad" }]}
                divisor={MB}
                height={160}
                compact
              />
              <RangeChartCard
                title="Network Traffic (MB/s)"
                series={[
                  { query: selectedName ? PromQL.netRxRange(selectedName) : null, dataKey: "rx", name: "RX", color: "#22d3ee", gradientId: "detailRxGrad" },
                  { query: selectedName ? PromQL.netTxRange(selectedName) : null, dataKey: "tx", name: "TX", color: "#f97316", gradientId: "detailTxGrad" },
                ]}
                divisor={MB}
                height={160}
                compact
              />
              <RangeChartCard
                title="Disk I/O (MB/s)"
                type="line"
                series={[
                  { query: selectedName ? PromQL.diskReadRange(selectedName) : null, dataKey: "read", name: "READ", color: "#34d399", gradientId: "detailReadGrad" },
                  { query: selectedName ? PromQL.diskWriteRange(selectedName) : null, dataKey: "write", name: "WRITE", color: "#fb7185", gradientId: "detailWriteGrad" },
                ]}
                divisor={MB}
                height={160}
                compact
              />
            </div>

            <div
              className="rounded-lg overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="px-4 py-3 border-b border-white/5">
                <span className="uppercase tracking-wider text-gray-400" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
                  Container Details
                </span>
              </div>
              <div className="divide-y divide-white/3" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                {[
                  ["Container ID", selected.id],
                  ["Name", selected.name],
                  ["Image", selected.image],
                  ["Status", selected.status.toUpperCase()],
                  ["Host", selected.host],
                  ...((() => {
                    const tblHost = findHost(selected)
                    return [
                      ["CPU Usage", `${selected.cpuPercent}%${tblHost ? ` (host: ${tblHost.cpuUsage}% of ${tblHost.cpuCores} cores)` : ''}`],
                      ["Memory (Container)", `${selected.memoryMB}MB / ${selected.memoryLimit}MB (${selected.memoryPercent}%)`],
                      ["Memory (Host)", tblHost ? `${tblHost.memUsedGB}GB / ${tblHost.memTotalGB}GB (${tblHost.memPercent}%)` : 'N/A'],
                      ["Network RX", `${fmtMB(selected.networkRxMB)} MB/s`],
                      ["Network TX", `${fmtMB(selected.networkTxMB)} MB/s`],
                      ["Disk Read", `${fmtMB(selected.diskReadMB)} MB/s`],
                      ["Disk Write", `${fmtMB(selected.diskWriteMB)} MB/s`],
                      ["Uptime", selected.uptime],
                      ...(tblHost ? [["Host Uptime", tblHost.uptime], ["Host OS", tblHost.os]] : []),
                    ]
                  })()),
                ].map(([label, val]) => (
                  <div key={label} className="flex px-4 py-2">
                    <span className="w-40 shrink-0 text-gray-500">{label}</span>
                    <span className="text-gray-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "14px" }}>
            Select a container to view details
          </div>
        )}
      </div>
    </div>
  )
}
