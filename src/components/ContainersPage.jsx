import { useState, useMemo } from "react"
import {
  Search, Cpu, MemoryStick, HardDrive, Network,
  ChevronRight, AlertTriangle, CheckCircle, XCircle,
} from "lucide-react"
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { useRangeQuery, PromQL, toTimeSeries, mergeTimeSeries } from "../Query"

const gridStroke = "rgba(255,255,255,0.03)"
const tickFill = "#555"
const tooltipStyle = {
  backgroundColor: "rgba(10,12,18,0.95)",
  border: "1px solid rgba(0,240,255,0.15)",
  borderRadius: "4px",
  fontFamily: "Share Tech Mono, monospace",
  fontSize: "11px",
  color: "#e5e7eb",
}

function StatusBadge({ status }) {
  const config = {
    running:   { icon: CheckCircle,    color: "text-emerald-400", bg: "bg-emerald-400/10", label: "RUNNING" },
    unhealthy: { icon: AlertTriangle,  color: "text-amber-400",   bg: "bg-amber-400/10",   label: "UNHEALTHY" },
    stopped:   { icon: XCircle,        color: "text-red-400",     bg: "bg-red-400/10",     label: "STOPPED" },
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

function MiniStat({ label, value, icon: Icon, color }) {
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
        <div className="text-white" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "20px", fontWeight: 600, lineHeight: 1.2 }}>
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

function DetailChart({ title, data, dataKeys, colors, gradientIds, type = "area" }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="uppercase tracking-wider mb-3 text-gray-400" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
        {title}
      </div>
      <div style={{ minWidth: 200, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                {dataKeys.map((key, i) => (
                  <linearGradient key={gradientIds[i]} id={gradientIds[i]} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[i]} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={colors[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "Share Tech Mono", color: "#666" }} />}
              {dataKeys.map((key, i) => (
                <Area key={key} type="monotone" dataKey={key} name={key.toUpperCase()} stroke={colors[i]} strokeWidth={1.5} fill={`url(#${gradientIds[i]})`} dot={false} />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "Share Tech Mono", color: "#666" }} />
              {dataKeys.map((key, i) => (
                <Line key={key} type="monotone" dataKey={key} name={key.toUpperCase()} stroke={colors[i]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const MB = 1024 * 1024

export default function ContainersPage({ containers = [] }) {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState("all")

  const filtered = useMemo(() =>
    containers.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.image.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus === "all" || c.status === filterStatus
      return matchesSearch && matchesStatus
    }),
    [containers, search, filterStatus]
  )

  // Auto-select first container if none selected
  const effectiveId = selectedId ?? containers[0]?.id ?? null
  const selected = containers.find((c) => c.id === effectiveId)
  const selectedName = selected?.name

  // Range queries for the selected container's charts
  const { data: cpuRaw } = useRangeQuery(selectedName ? PromQL.cpuRange(selectedName) : null)
  const { data: memRaw } = useRangeQuery(selectedName ? PromQL.memoryRange(selectedName) : null)
  const { data: rxRaw } = useRangeQuery(selectedName ? PromQL.netRxRange(selectedName) : null)
  const { data: txRaw } = useRangeQuery(selectedName ? PromQL.netTxRange(selectedName) : null)
  const { data: diskReadRaw } = useRangeQuery(selectedName ? PromQL.diskReadRange(selectedName) : null)
  const { data: diskWriteRaw } = useRangeQuery(selectedName ? PromQL.diskWriteRange(selectedName) : null)

  const cpuData = useMemo(() => toTimeSeries(cpuRaw), [cpuRaw])
  const memData = useMemo(() => toTimeSeries(memRaw, "value", MB), [memRaw])
  const netData = useMemo(() => mergeTimeSeries(rxRaw, txRaw, "rx", "tx", MB), [rxRaw, txRaw])
  const diskData = useMemo(() => mergeTimeSeries(diskReadRaw, diskWriteRaw, "read", "write", MB), [diskReadRaw, diskWriteRaw])

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

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Left panel — container list */}
      <div
        className="w-[320px] shrink-0 flex flex-col h-full border-r overflow-hidden"
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
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  filterStatus === f.key
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
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left rounded-lg p-3 mb-1 transition-all cursor-pointer ${
                  isSelected
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
                  <ChevronRight className={`w-3 h-3 transition-colors ${isSelected ? "text-cyan-400" : "text-gray-700"}`} />
                </div>

                <div className="text-gray-600 mb-2" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                  {c.image}
                </div>

                {/* Mini resource bars */}
                <div className="space-y-1.5">
                  {[
                    { label: "CPU", percent: c.cpuPercent, warn: c.cpuPercent > 80, color: "#00f0ff", warnColor: "text-red-400", okColor: "text-cyan-500" },
                    { label: "MEM", percent: c.memoryPercent, warn: c.memoryPercent > 80, color: "#a855f7", warnColor: "text-red-400", okColor: "text-purple-500" },
                  ].map((bar) => (
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

      {/* Right panel — container detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
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
              <MiniStat label="Network I/O" value={`↓${selected.networkRxMB.toFixed(0)} ↑${selected.networkTxMB.toFixed(0)}`} icon={Network} color="#22d3ee" />
              <MiniStat label="Disk I/O" value={`R:${selected.diskReadMB}MB W:${selected.diskWriteMB}MB`} icon={HardDrive} color="#34d399" />
            </div>

            {/* Utilization bars */}
            <div
              className="rounded-lg p-4 space-y-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div className="uppercase tracking-wider text-gray-400" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
                Resource Utilization
              </div>
              <UtilizationBar label="CPU" percent={selected.cpuPercent} color="#00f0ff" />
              <UtilizationBar label="MEMORY" percent={selected.memoryPercent} color="#a855f7" />
              <UtilizationBar label="DISK" percent={Math.min(((selected.diskReadMB + selected.diskWriteMB) / 300 * 100), 100).toFixed(1)} color="#34d399" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DetailChart title="CPU Usage Over Time (%)" data={cpuData} dataKeys={["value"]} colors={["#00f0ff"]} gradientIds={["detailCpuGrad"]} />
              <DetailChart title="Memory Usage Over Time (MB)" data={memData} dataKeys={["value"]} colors={["#a855f7"]} gradientIds={["detailMemGrad"]} />
              <DetailChart title="Network Traffic (MB/s)" data={netData} dataKeys={["rx", "tx"]} colors={["#22d3ee", "#f97316"]} gradientIds={["detailRxGrad", "detailTxGrad"]} />
              <DetailChart title="Disk I/O (MB/s)" data={diskData} dataKeys={["read", "write"]} colors={["#34d399", "#fb7185"]} gradientIds={["detailReadGrad", "detailWriteGrad"]} type="line" />
            </div>

            {/* Details table */}
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
                  ["CPU Usage", `${selected.cpuPercent}%`],
                  ["Memory Usage", `${selected.memoryMB}MB / ${selected.memoryLimit}MB (${selected.memoryPercent}%)`],
                  ["Network RX", `${selected.networkRxMB} MB`],
                  ["Network TX", `${selected.networkTxMB} MB`],
                  ["Disk Read", `${selected.diskReadMB} MB`],
                  ["Disk Write", `${selected.diskWriteMB} MB`],
                  ["Uptime", selected.uptime],
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
