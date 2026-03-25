import { useMemo } from "react"
import {
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
import { useDashboard } from "../context/DashboardContext"
import { PromQL } from "../Query"
import MetricsCard from "./MetricsCard"
import RangeChartCard from "./RangeChartCard"

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
  const { containers, stats, hosts } = useDashboard()

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
        if (String(fs.mountpoint).includes("mnt")) continue;

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

      <SectionHeading label="Host Telemetry // Time Series" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RangeChartCard
          title="Linux Host — CPU Usage (%)"
          series={[{ query: PromQL.nodeCpuRangeAll, dataKey: "value", name: "CPU %", color: "#00f0ff", gradientId: "nCpuG" }]}
          yDomain={[0, 100]}
        />
        <RangeChartCard
          title="Windows Host — CPU Usage (%)"
          series={[{ query: PromQL.winCpuRangeAll, dataKey: "value", name: "CPU %", color: "#22d3ee", gradientId: "wCpuG" }]}
          yDomain={[0, 100]}
        />
        <RangeChartCard
          title="Linux Host — Memory Used (GB)"
          series={[{ query: PromQL.nodeMemUsedRange, dataKey: "value", name: "Used GB", color: "#a855f7", gradientId: "nMemG" }]}
          divisor={GB}
          yDomain={[0, linuxHost?.memTotalGB ?? "auto"]}
        />
        <RangeChartCard
          title="Windows Host — Memory Used (GB)"
          series={[{ query: PromQL.winMemUsedRange, dataKey: "value", name: "Used GB", color: "#818cf8", gradientId: "wMemG" }]}
          divisor={GB}
          yDomain={[0, windowsHost?.memTotalGB ?? "auto"]}
        />
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
        <MetricsCard title="Total Containers" value={stats.total} subtitle={`${stats.running} running`} icon={<Container className="w-4 h-4" />} accentColor="#00f0ff" />
        <MetricsCard title="Running" value={stats.running} subtitle={`${((stats.running / (stats.total || 1)) * 100).toFixed(0)}% of fleet`} icon={<CheckCircle className="w-4 h-4" />} accentColor="#34d399" />
        <MetricsCard title="Unhealthy" value={stats.unhealthy} subtitle={stats.unhealthy > 0 ? "needs attention" : "all clear"} icon={<AlertTriangle className="w-4 h-4" />} accentColor="#fbbf24" />
        <MetricsCard title="Stopped" value={stats.stopped} subtitle="inactive" icon={<XCircle className="w-4 h-4" />} accentColor="#f87171" />
        <MetricsCard title="Container CPU" value={`${stats.totalCpu}%`} subtitle={`avg ${stats.avgCpu}% each`} icon={<Cpu className="w-4 h-4" />} accentColor="#00f0ff" />
        <MetricsCard title="Container Mem" value={`${(stats.totalMemoryMB / 1024).toFixed(1)} GB`} subtitle={`of ${(stats.totalMemoryLimitMB / 1024).toFixed(1)} GB limit`} icon={<MemoryStick className="w-4 h-4" />} accentColor="#a855f7" />
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
      <SectionHeading label="Container Telemetry // Time Series" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RangeChartCard
          title="Container Aggregate CPU (%)"
          series={[{ query: PromQL.cpuRangeAll, dataKey: "value", name: "CPU %", color: "#00f0ff", gradientId: "mcpuGrad" }]}
        />
        <RangeChartCard
          title="Container Aggregate Memory (MB)"
          series={[{ query: PromQL.memoryRangeAll, dataKey: "value", name: "Memory MB", color: "#a855f7", gradientId: "mmemGrad" }]}
          divisor={MB}
        />
        <RangeChartCard
          title="Container Network Traffic (MB/s)"
          series={[
            { query: PromQL.netRxRangeAll, dataKey: "rx", name: "RX", color: "#22d3ee", gradientId: "mrxGrad" },
            { query: PromQL.netTxRangeAll, dataKey: "tx", name: "TX", color: "#f97316", gradientId: "mtxGrad" },
          ]}
          divisor={MB}
        />
        <RangeChartCard
          title="Container Disk I/O (MB/s)"
          type="line"
          series={[
            { query: PromQL.diskReadRangeAll, dataKey: "read", name: "READ", color: "#34d399", gradientId: "mrdG" },
            { query: PromQL.diskWriteRangeAll, dataKey: "write", name: "WRITE", color: "#fb7185", gradientId: "mwrG" },
          ]}
          divisor={MB}
        />
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
