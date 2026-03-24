import { useMemo } from "react"
import {
  AreaChart, Area, LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import {
  Cpu, MemoryStick, Container,
  AlertTriangle, CheckCircle,
  XCircle, Server, Thermometer, Monitor,
} from "lucide-react"
import { useContainers } from "../hooks/useContainers"
import { useSystem } from "../hooks/useSystem"
import { useRangeQuery, PromQL, toTimeSeries, mergeTimeSeries } from "../Query"

const MB = 1024 * 1024
const GB = 1024 * 1024 * 1024

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
const legendStyle = { fontSize: "10px", fontFamily: "Share Tech Mono", color: "#666" }
const PIE_COLORS = ["#00f0ff", "#a855f7", "#f97316", "#34d399", "#f87171", "#fbbf24", "#22d3ee", "#818cf8"]
const STATUS_COLORS = { running: "#34d399", unhealthy: "#fbbf24", stopped: "#f87171" }

function StatCard({ title, value, subtitle, icon, accentColor }) {
  return (
    <div
      className="relative overflow-hidden rounded-lg p-4 group transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: `1px solid ${accentColor}15`,
        boxShadow: `0 0 20px ${accentColor}08`,
      }}
    >
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-20 group-hover:opacity-40 transition-opacity"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}40, transparent 70%)` }}
      />
      <div
        className="absolute top-0 left-0 h-px w-12 group-hover:w-full transition-all duration-500"
        style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
      />
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded" style={{ background: `${accentColor}15` }}>
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
      </div>
      <div className="uppercase tracking-wider mb-1 text-gray-500" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
        {title}
      </div>
      <div className="text-white" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "28px", fontWeight: 600, lineHeight: 1.1 }}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: "1px solid rgba(0,240,255,0.06)",
      }}
    >
      <div className="uppercase tracking-wider mb-4 text-gray-400" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "12px" }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SectionHeading({ label }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
      <span className="uppercase tracking-wider text-gray-300" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}>
        {label}
      </span>
      <div className="flex-1 h-px bg-cyan-500/10" />
    </div>
  )
}

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 1.35
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#9ca3af" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" style={{ fontFamily: "Share Tech Mono", fontSize: "10px" }}>
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.[0]) return null
  const { name, value, payload: p } = payload[0]
  return (
    <div style={tooltipStyle} className="px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
        <span>{name}</span>
      </div>
      <div className="text-white mt-1">{value}</div>
    </div>
  )
}

export default function MetricsPage() {
  const { containers, stats } = useContainers()
  const { hosts } = useSystem()

  const { data: cpuRaw } = useRangeQuery(PromQL.cpuRangeAll)
  const { data: memRaw } = useRangeQuery(PromQL.memoryRangeAll)
  const { data: rxRaw } = useRangeQuery(PromQL.netRxRangeAll)
  const { data: txRaw } = useRangeQuery(PromQL.netTxRangeAll)
  const { data: diskReadRaw } = useRangeQuery(PromQL.diskReadRangeAll)
  const { data: diskWriteRaw } = useRangeQuery(PromQL.diskWriteRangeAll)

  const { data: nodeCpuRangeRaw } = useRangeQuery(PromQL.nodeCpuRangeAll)
  const { data: nodeMemRangeRaw } = useRangeQuery(PromQL.nodeMemUsedRange)
  const { data: nodeLoadRangeRaw } = useRangeQuery(PromQL.nodeLoadRange)
  const { data: winCpuRangeRaw } = useRangeQuery(PromQL.winCpuRangeAll)
  const { data: winMemRangeRaw } = useRangeQuery(PromQL.winMemUsedRange)

  const cpuData = useMemo(() => toTimeSeries(cpuRaw), [cpuRaw])
  const memData = useMemo(() => toTimeSeries(memRaw, "value", MB), [memRaw])
  const netData = useMemo(() => mergeTimeSeries(rxRaw, txRaw, "rx", "tx", MB), [rxRaw, txRaw])
  const diskData = useMemo(() => mergeTimeSeries(diskReadRaw, diskWriteRaw, "read", "write", MB), [diskReadRaw, diskWriteRaw])

  const nodeCpuData = useMemo(() => toTimeSeries(nodeCpuRangeRaw), [nodeCpuRangeRaw])
  const nodeMemData = useMemo(() => toTimeSeries(nodeMemRangeRaw, "value", GB), [nodeMemRangeRaw])
  const nodeLoadData = useMemo(() => toTimeSeries(nodeLoadRangeRaw, "load"), [nodeLoadRangeRaw])
  const winCpuData = useMemo(() => toTimeSeries(winCpuRangeRaw), [winCpuRangeRaw])
  const winMemData = useMemo(() => toTimeSeries(winMemRangeRaw, "value", GB), [winMemRangeRaw])

  const statusPie = useMemo(() => [
    { name: "Running", value: stats.running, color: STATUS_COLORS.running },
    { name: "Unhealthy", value: stats.unhealthy, color: STATUS_COLORS.unhealthy },
    { name: "Stopped", value: stats.stopped, color: STATUS_COLORS.stopped },
  ].filter((d) => d.value > 0), [stats])

  const cpuPerContainer = useMemo(
    () => [...containers].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, 8).map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
      value: c.cpuPercent,
    })),
    [containers],
  )

  const memPerContainer = useMemo(
    () => [...containers].sort((a, b) => b.memoryMB - a.memoryMB).slice(0, 8).map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
      value: c.memoryMB,
    })),
    [containers],
  )

  const diskPie = useMemo(() => {
    const items = []
    for (const h of hosts) {
      for (const fs of h.filesystems) {
        items.push({
          name: `${h.id === 'linux' ? 'Linux' : 'Windows'} ${fs.mountpoint}`,
          used: fs.usedGB,
          free: fs.availGB,
        })
      }
    }
    return items
  }, [hosts])

  const linuxHost = hosts.find((h) => h.id === "linux")
  const windowsHost = hosts.find((h) => h.id === "windows")

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-px bg-cyan-500/40" />
          <span className="text-cyan-400/60" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase" }}>
            System Metrics
          </span>
          <div className="w-20 h-px bg-cyan-500/20" />
        </div>
        <span className="ml-auto text-gray-700" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          {hosts.length} HOSTS // {containers.length} CONTAINERS // {new Date().toLocaleTimeString()}
        </span>
      </div>

      <SectionHeading label="Host Systems // Overview" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hosts.map((h) => (
          <HostCard key={h.id} host={h} />
        ))}
      </div>

      <SectionHeading label="Host Telemetry // Time Series (1h)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Linux CPU */}
        {nodeCpuData.length > 0 && (
          <ChartCard title="Linux Host — CPU Usage (%)">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nodeCpuData}>
                  <defs>
                    <linearGradient id="nCpuG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" name="CPU %" stroke="#00f0ff" strokeWidth={1.5} fill="url(#nCpuG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Windows CPU */}
        {winCpuData.length > 0 && (
          <ChartCard title="Windows Host — CPU Usage (%)">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={winCpuData}>
                  <defs>
                    <linearGradient id="wCpuG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" name="CPU %" stroke="#22d3ee" strokeWidth={1.5} fill="url(#wCpuG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Linux Memory */}
        {nodeMemData.length > 0 && (
          <ChartCard title="Linux Host — Memory Used (GB)">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nodeMemData}>
                  <defs>
                    <linearGradient id="nMemG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} domain={[0, linuxHost?.memTotalGB ?? 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" name="Used GB" stroke="#a855f7" strokeWidth={1.5} fill="url(#nMemG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Windows Memory */}
        {winMemData.length > 0 && (
          <ChartCard title="Windows Host — Memory Used (GB)">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={winMemData}>
                  <defs>
                    <linearGradient id="wMemG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} domain={[0, windowsHost?.memTotalGB ?? 'auto']} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="value" name="Used GB" stroke="#818cf8" strokeWidth={1.5} fill="url(#wMemG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

        {/* Linux Load Average */}
        {nodeLoadData.length > 0 && (
          <ChartCard title="Linux Host — Load Average (1m)">
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={nodeLoadData}>
                  <defs>
                    <linearGradient id="nLoadG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="load" name="Load" stroke="#f97316" strokeWidth={1.5} fill="url(#nLoadG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>

      <SectionHeading label="Storage // Disk Usage" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {hosts.map((h) => (
          <ChartCard key={h.id} title={`${h.id === 'linux' ? 'Linux' : 'Windows'} — Volumes`}>
            <div className="space-y-3">
              {h.filesystems.map((fs) => (
                <div key={fs.mountpoint}>
                  <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                    <span className="text-gray-400">{fs.mountpoint} <span className="text-gray-600">({fs.device})</span></span>
                    <span className="text-gray-400">{fs.usedGB} / {fs.sizeGB} GB <span className={fs.usedPercent > 85 ? "text-red-400" : fs.usedPercent > 70 ? "text-amber-400" : "text-emerald-400"}>({fs.usedPercent}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(fs.usedPercent, 100)}%`,
                        background: fs.usedPercent > 85
                          ? "linear-gradient(90deg, #f87171, #ef4444)"
                          : fs.usedPercent > 70
                            ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                            : "linear-gradient(90deg, #34d399, #10b981)",
                        boxShadow: fs.usedPercent > 85 ? "0 0 8px rgba(248,113,113,0.4)" : "0 0 8px rgba(52,211,153,0.3)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        ))}
      </div>

      {/* Disk usage pie chart */}
      {diskPie.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Storage — Used vs Free (GB)">
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diskPie} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,240,255,0.06)" }} />
                  <Legend wrapperStyle={legendStyle} />
                  <Bar dataKey="used" name="Used GB" stackId="a" fill="#f87171" radius={[0, 0, 0, 0]} barSize={14} />
                  <Bar dataKey="free" name="Free GB" stackId="a" fill="#34d399" radius={[0, 2, 2, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Total Storage Allocation">
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={diskPie.map((d) => ({ name: d.name, value: parseFloat((d.used + d.free).toFixed(1)) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2} label={renderPieLabel} labelLine={false}>
                    {diskPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip unit=" GB" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      <SectionHeading label="Container Fleet // Overview" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Containers" value={stats.total} subtitle={`${stats.running} running`} icon={<Container className="w-4 h-4" />} accentColor="#00f0ff" />
        <StatCard title="Running" value={stats.running} subtitle={`${((stats.running / (stats.total || 1)) * 100).toFixed(0)}% of fleet`} icon={<CheckCircle className="w-4 h-4" />} accentColor="#34d399" />
        <StatCard title="Unhealthy" value={stats.unhealthy} subtitle={stats.unhealthy > 0 ? "needs attention" : "all clear"} icon={<AlertTriangle className="w-4 h-4" />} accentColor="#fbbf24" />
        <StatCard title="Stopped" value={stats.stopped} subtitle="inactive" icon={<XCircle className="w-4 h-4" />} accentColor="#f87171" />
        <StatCard title="Container CPU" value={`${stats.totalCpu}%`} subtitle={`avg ${stats.avgCpu}% each`} icon={<Cpu className="w-4 h-4" />} accentColor="#00f0ff" />
        <StatCard title="Container Mem" value={`${(stats.totalMemoryMB / 1024).toFixed(1)} GB`} subtitle={`of ${(stats.totalMemoryLimitMB / 1024).toFixed(1)} GB limit`} icon={<MemoryStick className="w-4 h-4" />} accentColor="#a855f7" />
      </div>

      {/* Pie Charts */}
      <SectionHeading label="Container Distribution // Breakdown" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Container Status">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3} label={renderPieLabel} labelLine={false}>
                  {statusPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="CPU % by Container (Top 8)">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cpuPerContainer} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} label={renderPieLabel} labelLine={false}>
                  {cpuPerContainer.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Memory (MB) by Container (Top 8)">
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memPerContainer} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} label={renderPieLabel} labelLine={false}>
                  {memPerContainer.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Time Graphs */}
      <SectionHeading label="Container Telemetry // Time Series (1h)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Container Aggregate CPU (%)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cpuData}>
                <defs>
                  <linearGradient id="mcpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" name="CPU %" stroke="#00f0ff" strokeWidth={1.5} fill="url(#mcpuGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Container Aggregate Memory (MB)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memData}>
                <defs>
                  <linearGradient id="mmemGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" name="Memory MB" stroke="#a855f7" strokeWidth={1.5} fill="url(#mmemGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Container Network Traffic (MB/s)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netData}>
                <defs>
                  <linearGradient id="mrxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mtxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
                <Area type="monotone" dataKey="rx" name="RX" stroke="#22d3ee" strokeWidth={1.5} fill="url(#mrxGrad)" dot={false} />
                <Area type="monotone" dataKey="tx" name="TX" stroke="#f97316" strokeWidth={1.5} fill="url(#mtxGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Container Disk I/O (MB/s)">
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={diskData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={legendStyle} />
                <Line type="monotone" dataKey="read" name="READ" stroke="#34d399" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="write" name="WRITE" stroke="#fb7185" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </main>
  )
}

function HostCard({ host }) {
  const isLinux = host.id === "linux"
  const accent = isLinux ? "#00f0ff" : "#818cf8"

  return (
    <div
      className="rounded-lg p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: `1px solid ${accent}12`,
      }}
    >
      <div className="absolute top-0 left-0 w-full h-px" style={{ background: `linear-gradient(90deg, ${accent}, transparent 50%)` }} />

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded" style={{ background: `${accent}15` }}>
          {isLinux ? <Server className="w-4 h-4" style={{ color: accent }} /> : <Monitor className="w-4 h-4" style={{ color: accent }} />}
        </div>
        <div>
          <div className="text-gray-300" style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "14px", fontWeight: 600 }}>{host.os}</div>
          <div className="text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px" }}>{host.os} • {host.arch} • {host.cpuCores} cores • up {host.uptime}</div>
        </div>
      </div>

      {/* CPU bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          <span className="text-gray-500">CPU ({host.cpuCores} cores)</span>
          <span style={{ color: host.cpuUsage > 80 ? "#f87171" : accent }}>{host.cpuUsage}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${Math.min(host.cpuUsage, 100)}%`,
            background: host.cpuUsage > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : `linear-gradient(90deg, ${accent}, ${accent}aa)`,
            boxShadow: `0 0 8px ${accent}60`,
          }} />
        </div>
      </div>

      {/* Memory bar */}
      <div className="mb-3">
        <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          <span className="text-gray-500">RAM ({host.memUsedGB} / {host.memTotalGB} GB)</span>
          <span style={{ color: host.memPercent > 80 ? "#f87171" : "#a855f7" }}>{host.memPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
          <div className="h-full rounded-full transition-all duration-700" style={{
            width: `${Math.min(host.memPercent, 100)}%`,
            background: host.memPercent > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #a855f7, #7c3aed)",
            boxShadow: "0 0 8px rgba(168,85,247,0.4)",
          }} />
        </div>
      </div>

      {/* Extra info row */}
      <div className="flex items-center gap-4 flex-wrap" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
        {host.load1 != null && (
          <span className="text-gray-500">LOAD <span className="text-orange-400">{host.load1}</span> / <span className="text-orange-300">{host.load5}</span> / <span className="text-orange-200">{host.load15}</span></span>
        )}
        {host.temp != null && (
          <span className="text-gray-500 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-red-400" />
            <span className={host.temp > 70 ? "text-red-400" : host.temp > 55 ? "text-amber-400" : "text-emerald-400"}>{host.temp}°C</span>
          </span>
        )}
        {host.filesystems.length > 0 && (
          <span className="text-gray-500">
            DISK {host.filesystems.map((fs) => `${fs.mountpoint} ${fs.usedPercent}%`).join(" • ")}
          </span>
        )}
      </div>
    </div>
  )
}
