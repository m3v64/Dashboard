import { useState, useMemo } from "react";
import { Search, Cpu, MemoryStick, HardDrive, Network, Clock, Server, Activity, ChevronRight, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { containers, getCpuTimeSeries, getMemoryTimeSeries, getNetworkTimeSeries } from "./mock-data";

function StatusBadge({ status, darkMode }) {
  const config = {
    running: { icon: CheckCircle, color: "text-emerald-400", bg: darkMode ? "bg-emerald-400/10" : "bg-emerald-50", label: "RUNNING" },
    unhealthy: { icon: AlertTriangle, color: "text-amber-400", bg: darkMode ? "bg-amber-400/10" : "bg-amber-50", label: "UNHEALTHY" },
    stopped: { icon: XCircle, color: "text-red-400", bg: darkMode ? "bg-red-400/10" : "bg-red-50", label: "STOPPED" },
  };
  const c = config[status] || config.stopped;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${c.bg} ${c.color}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function MiniStat({ label, value, icon, color, darkMode }) {
  const Icon = icon;
  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{
        background: darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        border: darkMode ? "1px solid rgba(255,255,255,0.04)" : "1px solid #e5e7eb",
      }}
    >
      <div className="p-2 rounded" style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className={`${darkMode ? "text-gray-500" : "text-gray-400"} uppercase tracking-wider`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px" }}>{label}</div>
        <div className={darkMode ? "text-white" : "text-gray-900"} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "20px", fontWeight: 600, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

function DetailChart({ title, data, dataKeys, colors, gradientIds, darkMode, type = "area" }) {
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

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: darkMode ? "rgba(255,255,255,0.02)" : "#ffffff",
        border: darkMode ? "1px solid rgba(255,255,255,0.04)" : "1px solid #e5e7eb",
      }}
    >
      <div className={`uppercase tracking-wider mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
        {title}
      </div>
      <div style={{ minWidth: 200, minHeight: 160, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                {dataKeys.map((key, idx) => (
                  <linearGradient key={gradientIds[idx]} id={gradientIds[idx]} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors[idx]} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={colors[idx]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              {dataKeys.length > 1 && <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "Share Tech Mono", color: darkMode ? "#666" : "#999" }} />}
              {dataKeys.map((key, idx) => (
                <Area key={key} type="monotone" dataKey={key} name={key.toUpperCase()} stroke={colors[idx]} strokeWidth={1.5} fill={`url(#${gradientIds[idx]})`} dot={false} />
              ))}
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: "10px", fontFamily: "Share Tech Mono", color: darkMode ? "#666" : "#999" }} />
              {dataKeys.map((key, idx) => (
                <Line key={key} type="monotone" dataKey={key} name={key.toUpperCase()} stroke={colors[idx]} strokeWidth={1.5} dot={false} />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function UtilizationBar({ label, percent, color, darkMode }) {
  return (
    <div>
      <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
        <span className={darkMode ? "text-gray-500" : "text-gray-400"}>{label}</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-gray-200"}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(percent, 100)}%`,
            background: percent > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : `linear-gradient(90deg, ${color}, ${color}aa)`,
            boxShadow: darkMode ? `0 0 8px ${color}66` : "none",
          }}
        />
      </div>
    </div>
  );
}

export function ContainersPage({ darkMode }) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(containers[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = useMemo(() => {
    return containers.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.image.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [search, filterStatus]);

  const selected = containers.find((c) => c.id === selectedId);

  const cpuData = useMemo(() => getCpuTimeSeries(selectedId ?? "c1"), [selectedId]);
  const memData = useMemo(() => getMemoryTimeSeries(selectedId ?? "c1"), [selectedId]);
  const netData = useMemo(() => getNetworkTimeSeries(selectedId ?? "c1"), [selectedId]);
  const diskData = useMemo(
    () => netData.map((d) => ({ time: d.time, read: parseFloat((Math.random() * 20 + 2).toFixed(1)), write: parseFloat((Math.random() * 15 + 1).toFixed(1)) })),
    [netData]
  );

  const statusCounts = useMemo(() => ({
    all: containers.length,
    running: containers.filter((c) => c.status === "running").length,
    unhealthy: containers.filter((c) => c.status === "unhealthy").length,
    stopped: containers.filter((c) => c.status === "stopped").length,
  }), []);

  const statusFilters = [
    { key: "all", label: "All", count: statusCounts.all },
    { key: "running", label: "Running", count: statusCounts.running },
    { key: "unhealthy", label: "Unhealthy", count: statusCounts.unhealthy },
    { key: "stopped", label: "Stopped", count: statusCounts.stopped },
  ];

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Left panel - Container list */}
      <div
        className="w-[320px] shrink-0 flex flex-col h-full border-r overflow-hidden"
        style={{
          borderColor: darkMode ? "rgba(255,255,255,0.05)" : "#e5e7eb",
          background: darkMode ? "rgba(8,10,16,0.5)" : "rgba(249,250,251,0.5)",
        }}
      >
        {/* Search & filters */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
            <span className={`uppercase tracking-wider ${darkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}>
              Containers
            </span>
          </div>

          <div className="relative">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter containers..."
              className={`w-full pl-8 pr-3 py-1.5 rounded outline-none transition-colors ${
                darkMode
                  ? "bg-white/[0.03] border border-white/[0.06] text-gray-300 placeholder-gray-600 focus:border-cyan-500/30"
                  : "bg-white border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-cyan-500/50"
              }`}
              style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  filterStatus === f.key
                    ? darkMode ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-700"
                    : darkMode ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
                }`}
                style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Container list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filtered.map((c) => {
            const isSelected = selectedId === c.id;
            const statusDot = c.status === "running" ? "bg-emerald-400" : c.status === "unhealthy" ? "bg-amber-400" : "bg-red-400";
            const cpuWarn = c.cpuPercent > 80;
            const memWarn = c.memoryPercent > 80;

            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left rounded-lg p-3 mb-1 transition-all cursor-pointer group ${
                  isSelected
                    ? darkMode ? "bg-cyan-500/[0.08] border border-cyan-500/20" : "bg-cyan-50 border border-cyan-200"
                    : darkMode ? "hover:bg-white/[0.02] border border-transparent" : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusDot}`}
                      style={c.status === "unhealthy" ? { boxShadow: "0 0 6px rgba(251,191,36,0.5)" } : {}}
                    />
                    <span className={`${darkMode ? "text-gray-200" : "text-gray-800"} ${isSelected ? "" : ""}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                      {c.name}
                    </span>
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-colors ${isSelected ? "text-cyan-400" : darkMode ? "text-gray-700" : "text-gray-300"}`} />
                </div>

                <div className={`mb-2 ${darkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                  {c.image}
                </div>

                {/* Mini resource bars */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 ${darkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px" }}>CPU</span>
                    <div className={`flex-1 h-1 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-gray-200"}`}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(c.cpuPercent, 100)}%`,
                        background: cpuWarn ? "#f87171" : "#00f0ff",
                      }} />
                    </div>
                    <span className={cpuWarn ? "text-red-400" : "text-cyan-500"} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px", width: "32px", textAlign: "right" }}>
                      {c.cpuPercent}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-8 ${darkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px" }}>MEM</span>
                    <div className={`flex-1 h-1 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-gray-200"}`}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(c.memoryPercent, 100)}%`,
                        background: memWarn ? "#f87171" : "#a855f7",
                      }} />
                    </div>
                    <span className={memWarn ? "text-red-400" : "text-purple-500"} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "9px", width: "32px", textAlign: "right" }}>
                      {c.memoryPercent}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className={`text-center py-8 ${darkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
              No containers found
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Container detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {selected ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-6 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
                  <h2 className={darkMode ? "text-white" : "text-gray-900"} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "24px", fontWeight: 600 }}>
                    {selected.name}
                  </h2>
                  <StatusBadge status={selected.status} darkMode={darkMode} />
                </div>
                <div className={`ml-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                  IMAGE: {selected.image} &nbsp;|&nbsp; HOST: {selected.host} &nbsp;|&nbsp; UPTIME: {selected.uptime}
                </div>
              </div>

              {(selected.cpuPercent > 80 || selected.memoryPercent > 80) && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-red-400/10 text-red-400" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  HIGH RESOURCE USAGE
                </div>
              )}
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MiniStat label="CPU Usage" value={`${selected.cpuPercent}%`} icon={Cpu} color="#00f0ff" darkMode={darkMode} />
              <MiniStat label="Memory" value={`${selected.memoryMB}MB`} icon={MemoryStick} color="#a855f7" darkMode={darkMode} />
              <MiniStat label="Network I/O" value={`↓${selected.networkRxMB.toFixed(0)} ↑${selected.networkTxMB.toFixed(0)}`} icon={Network} color="#22d3ee" darkMode={darkMode} />
              <MiniStat label="Disk I/O" value={`R:${selected.diskReadMB}MB W:${selected.diskWriteMB}MB`} icon={HardDrive} color="#34d399" darkMode={darkMode} />
            </div>

            {/* Utilization bars */}
            <div
              className="rounded-lg p-4 space-y-3"
              style={{
                background: darkMode ? "rgba(255,255,255,0.02)" : "#ffffff",
                border: darkMode ? "1px solid rgba(255,255,255,0.04)" : "1px solid #e5e7eb",
              }}
            >
              <div className={`uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
                Resource Utilization
              </div>
              <UtilizationBar label="CPU" percent={selected.cpuPercent} color="#00f0ff" darkMode={darkMode} />
              <UtilizationBar label="MEMORY" percent={selected.memoryPercent} color="#a855f7" darkMode={darkMode} />
              <UtilizationBar label="DISK" percent={Math.min(((selected.diskReadMB + selected.diskWriteMB) / 300 * 100), 100).toFixed(1)} color="#34d399" darkMode={darkMode} />
            </div>

            {/* Charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DetailChart
                title="CPU Usage Over Time (%)"
                data={cpuData}
                dataKeys={["value"]}
                colors={["#00f0ff"]}
                gradientIds={["detailCpuGrad"]}
                darkMode={darkMode}
              />
              <DetailChart
                title="Memory Usage Over Time (MB)"
                data={memData}
                dataKeys={["value"]}
                colors={["#a855f7"]}
                gradientIds={["detailMemGrad"]}
                darkMode={darkMode}
              />
              <DetailChart
                title="Network Traffic (MB/s)"
                data={netData}
                dataKeys={["rx", "tx"]}
                colors={["#22d3ee", "#f97316"]}
                gradientIds={["detailRxGrad", "detailTxGrad"]}
                darkMode={darkMode}
              />
              <DetailChart
                title="Disk I/O (MB/s)"
                data={diskData}
                dataKeys={["read", "write"]}
                colors={["#34d399", "#fb7185"]}
                gradientIds={["detailReadGrad", "detailWriteGrad"]}
                darkMode={darkMode}
                type="line"
              />
            </div>

            {/* Container info table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: darkMode ? "rgba(255,255,255,0.02)" : "#ffffff",
                border: darkMode ? "1px solid rgba(255,255,255,0.04)" : "1px solid #e5e7eb",
              }}
            >
              <div className={`px-4 py-3 border-b ${darkMode ? "border-white/5" : "border-gray-100"}`}>
                <span className={`uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px" }}>
                  Container Details
                </span>
              </div>
              <div className="divide-y" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px", borderColor: darkMode ? "rgba(255,255,255,0.03)" : "#f3f4f6" }}>
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
                  <div key={label} className={`flex px-4 py-2 ${darkMode ? "divide-white/[0.03]" : ""}`}>
                    <span className={`w-40 shrink-0 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{label}</span>
                    <span className={darkMode ? "text-gray-200" : "text-gray-700"}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-center h-full ${darkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "14px" }}>
            Select a container to view details
          </div>
        )}
      </div>
    </div>
  );
}
