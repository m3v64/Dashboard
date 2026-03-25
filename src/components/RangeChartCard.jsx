import { useState, useMemo, useRef } from "react"
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts"
import { useRangeQuery, TIME_RANGES, toTimeSeries, mergeTimeSeries } from "../Query"

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

function TimeSelect({ value, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none">
      {TIME_RANGES.map((r) => (
        <button
          key={r.label}
          onClick={() => onChange(r)}
          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            value.label === r.label
              ? "bg-cyan-500/15 text-cyan-400"
              : "text-gray-600 hover:text-gray-400 hover:bg-white/5"
          }`}
          style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px" }}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

export default function RangeChartCard({
  title,
  series,
  type = "area",
  divisor = 1,
  yDomain,
  height = 200,
  className = "",
  compact = false,
}) {
  const [range, setRange] = useState(TIME_RANGES[1]) // default 1h
  const keyRef = useRef(0)
  const prevRange = useRef(range.label)

  if (prevRange.current !== range.label) {
    prevRange.current = range.label
    keyRef.current += 1
  }

  const queryOpts = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    return { start: now - range.seconds, end: now, step: range.step }
  }, [range])

  const q1 = series[0]?.query ?? null
  const q2 = series[1]?.query ?? null
  const { data: raw1 } = useRangeQuery(q1, queryOpts)
  const { data: raw2 } = useRangeQuery(q2, queryOpts)

  const chartData = useMemo(() => {
    if (series.length === 1) {
      return toTimeSeries(raw1, series[0].dataKey, divisor)
    }
    return mergeTimeSeries(raw1, raw2, series[0].dataKey, series[1].dataKey, divisor)
  }, [raw1, raw2, series, divisor])

  const chartKey = `${keyRef.current}-${chartData.length}`
  const fontSize = compact ? 9 : 10
  const showLegend = series.length > 1

  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{
        background: compact
          ? "rgba(255,255,255,0.02)"
          : "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: compact
          ? "1px solid rgba(255,255,255,0.04)"
          : "1px solid rgba(0,240,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="uppercase tracking-wider text-gray-400"
          style={{ fontFamily: "Rajdhani, sans-serif", fontSize: compact ? "11px" : "12px" }}
        >
          {title}
        </div>
        <TimeSelect value={range} onChange={setRange} />
      </div>

      <div style={{ minWidth: 200, height }}>
        <ResponsiveContainer key={chartKey} width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                {series.map((s) => (
                  <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize, fill: tickFill }} axisLine={false} tickLine={false} domain={yDomain} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend wrapperStyle={legendStyle} />}
              {series.map((s) => (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={1.5}
                  fill={`url(#${s.gradientId})`}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize, fill: tickFill }} axisLine={false} tickLine={false} domain={yDomain} />
              <Tooltip contentStyle={tooltipStyle} />
              {showLegend && <Legend wrapperStyle={legendStyle} />}
              {series.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
