import { useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { getCpuTimeSeries, getMemoryTimeSeries, getNetworkTimeSeries } from "./mock-data";

function ChartCard({ title, children, darkMode }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: darkMode
          ? "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)"
          : "#ffffff",
        border: darkMode ? "1px solid rgba(0,240,255,0.06)" : "1px solid #e5e7eb",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "12px" }}>
          {title}
        </span>
      </div>
      <div className="h-[180px]" style={{ minWidth: 200, minHeight: 180 }}>{children}</div>
    </div>
  );
}

export function ChartsPanel({ containerId, containerName, darkMode }) {
  const cpuData = useMemo(() => getCpuTimeSeries(containerId ?? "c1"), [containerId]);
  const memData = useMemo(() => getMemoryTimeSeries(containerId ?? "c1"), [containerId]);
  const netData = useMemo(() => getNetworkTimeSeries(containerId ?? "c1"), [containerId]);
  const diskData = useMemo(
    () => netData.map((d) => ({ time: d.time, read: parseFloat((Math.random() * 20 + 2).toFixed(1)), write: parseFloat((Math.random() * 15 + 1).toFixed(1)) })),
    [netData]
  );

  const gridStroke = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)";
  const tickFill = darkMode ? "#555" : "#999";

  const tooltipStyle = {
    backgroundColor: darkMode ? "rgba(10,12,18,0.95)" : "rgba(255,255,255,0.95)",
    border: darkMode ? "1px solid rgba(0,240,255,0.15)" : "1px solid #e5e7eb",
    borderRadius: "4px",
    fontFamily: "Share Tech Mono, monospace",
    fontSize: "11px",
    color: darkMode ? "#e5e7eb" : "#374151",
  };

  const legendStyle = { fontSize: "10px", fontFamily: "Share Tech Mono", color: darkMode ? "#666" : "#999" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
        <span className={`uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}>
          {containerName || "System"} // Telemetry
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="CPU Usage (%)" darkMode={darkMode}>
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

        <ChartCard title="Memory Usage (MB)" darkMode={darkMode}>
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

        <ChartCard title="Network Traffic (MB/s)" darkMode={darkMode}>
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

        <ChartCard title="Disk I/O (MB/s)" darkMode={darkMode}>
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
  );
}