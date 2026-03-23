import { ChevronRight } from "lucide-react";

export function ContainerTable({ containers, selectedId, onSelect, darkMode }) {
  const statusColor = (s) =>
    s === "running" ? "bg-emerald-400" : s === "unhealthy" ? "bg-amber-400" : "bg-red-400";

  const cpuColor = (v) =>
    v > 80 ? "text-red-400" : v > 50 ? "text-amber-400" : "text-cyan-500";

  const memColor = (v) =>
    v > 80 ? "text-red-400" : v > 50 ? "text-amber-400" : "text-purple-500";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: darkMode
          ? "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)"
          : "#ffffff",
        border: darkMode ? "1px solid rgba(0,240,255,0.06)" : "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? "border-white/5" : "border-gray-100"}`}>
        <span className={`uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "12px" }}>
          Container Registry
        </span>
        <span className={darkMode ? "text-gray-600" : "text-gray-400"} style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          {containers.length} UNITS
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
          <thead>
            <tr className={`border-b ${darkMode ? "text-gray-600 border-white/5" : "text-gray-400 border-gray-100"}`}>
              <th className="text-left px-4 py-2 font-normal">STATUS</th>
              <th className="text-left px-4 py-2 font-normal">NAME</th>
              <th className="text-left px-4 py-2 font-normal">IMAGE</th>
              <th className="text-right px-4 py-2 font-normal">CPU</th>
              <th className="text-right px-4 py-2 font-normal">MEM</th>
              <th className="text-right px-4 py-2 font-normal">NET I/O</th>
              <th className="text-left px-4 py-2 font-normal">HOST</th>
              <th className="text-left px-4 py-2 font-normal">UPTIME</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {containers.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`border-b cursor-pointer transition-all ${
                  darkMode
                    ? `border-white/[0.03] hover:bg-white/[0.02] ${selectedId === c.id ? "bg-cyan-500/[0.05]" : ""}`
                    : `border-gray-50 hover:bg-gray-50 ${selectedId === c.id ? "bg-cyan-50" : ""}`
                }`}
              >
                <td className="px-4 py-2.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${statusColor(c.status)}`}
                    style={c.status === "unhealthy" ? { boxShadow: "0 0 6px rgba(251,191,36,0.5)" } : {}}
                  />
                </td>
                <td className={`px-4 py-2.5 ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{c.name}</td>
                <td className={`px-4 py-2.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{c.image}</td>
                <td className={`px-4 py-2.5 text-right ${cpuColor(c.cpuPercent)}`}>{c.cpuPercent}%</td>
                <td className={`px-4 py-2.5 text-right ${memColor(c.memoryPercent)}`}>{c.memoryMB}MB</td>
                <td className={`px-4 py-2.5 text-right ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  ↓{c.networkRxMB.toFixed(0)} ↑{c.networkTxMB.toFixed(0)}
                </td>
                <td className={`px-4 py-2.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{c.host}</td>
                <td className={`px-4 py-2.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{c.uptime}</td>
                <td className="px-4 py-2.5">
                  <ChevronRight className={`w-3 h-3 transition-colors ${selectedId === c.id ? "text-cyan-400" : darkMode ? "text-gray-700" : "text-gray-300"}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
