import { useMemo } from "react"
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { useRangeQuery, PromQL, toTimeSeries, mergeTimeSeries } from "../Query"

const MB = 1024 * 1024

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

function ChartCard({ title, children }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: "1px solid rgba(0,240,255,0.06)",
      }}
    >
      <div
        className="uppercase tracking-wider mb-4 text-gray-400"
        style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "12px" }}
      >
        {title}
      </div>
      <div style={{ minWidth: 200, height: 180 }}>{children}</div>
    </div>
  )
}

export default function ChartsPanel({ containerName }) {
  const name = containerName && containerName !== "All Containers" ? containerName : null
  const { data: cpuRaw } = useRangeQuery(name ? PromQL.cpuRange(name) : PromQL.cpuRangeAll)
  const { data: memRaw } = useRangeQuery(name ? PromQL.memoryRange(name) : PromQL.memoryRangeAll)
  const { data: rxRaw } = useRangeQuery(name ? PromQL.netRxRange(name) : PromQL.netRxRangeAll)
  const { data: txRaw } = useRangeQuery(name ? PromQL.netTxRange(name) : PromQL.netTxRangeAll)
  const { data: diskReadRaw } = useRangeQuery(name ? PromQL.diskReadRange(name) : PromQL.diskReadRangeAll)
  const { data: diskWriteRaw } = useRangeQuery(name ? PromQL.diskWriteRange(name) : PromQL.diskWriteRangeAll)

  const cpuData = useMemo(() => toTimeSeries(cpuRaw), [cpuRaw])
  const memData = useMemo(() => toTimeSeries(memRaw, "value", MB), [memRaw])
  const netData = useMemo(() => mergeTimeSeries(rxRaw, txRaw, "rx", "tx", MB), [rxRaw, txRaw])
  const diskData = useMemo(() => mergeTimeSeries(diskReadRaw, diskWriteRaw, "read", "write", MB), [diskReadRaw, diskWriteRaw])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
        <span
          className="uppercase tracking-wider text-gray-300"
          style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}
        >
          {containerName || "System"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CPU */}
        <ChartCard title="CPU Usage (%)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpuData}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#00f0ff" strokeWidth={1.5} fill="url(#cpuGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Memory */}
        <ChartCard title="Memory Usage (MB)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={memData}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={1.5} fill="url(#memGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Network */}
        <ChartCard title="Network Traffic (MB/s)">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netData}>
              <defs>
                <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={legendStyle} />
              <Area type="monotone" dataKey="rx" name="RX" stroke="#22d3ee" strokeWidth={1.5} fill="url(#rxGrad)" dot={false} />
              <Area type="monotone" dataKey="tx" name="TX" stroke="#f97316" strokeWidth={1.5} fill="url(#txGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Disk I/O */}
        <ChartCard title="Disk I/O (MB/s)">
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
        </ChartCard>
      </div>
    </div>
  )
}
