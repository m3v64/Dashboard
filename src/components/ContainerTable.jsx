import { useMemo } from "react"
import { Link } from "react-router"
import { ChevronRight, Star } from "lucide-react"
import { useDashboard } from "../context/DashboardContext"
import { fmtMB } from "../Query"

const statusColor = (s) =>
  s === "running" ? "bg-emerald-400" : s === "unhealthy" ? "bg-amber-400" : "bg-red-400"

const cpuColor = (v) =>
  v > 80 ? "text-red-400" : v > 50 ? "text-amber-400" : "text-cyan-500"

const memColor = (v) =>
  v > 80 ? "text-red-400" : v > 50 ? "text-amber-400" : "text-purple-500"

export default function ContainerTable({ containers, selectedId, onSelect }) {
  const { toggleFavorite, isFavorite } = useDashboard()

  const sorted = useMemo(() =>
    [...containers].sort((a, b) => isFavorite(b.id) - isFavorite(a.id)),
    [containers, isFavorite]
  )

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: "1px solid rgba(0,240,255,0.06)",
      }}
    >
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <span
          className="uppercase tracking-wider text-gray-400"
          style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "12px" }}
        >
          Container Registry
        </span>
        <span className="text-gray-600" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          {containers.length} UNITS
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
          <thead>
            <tr className="border-b text-gray-600 border-white/5">
              <th className="px-4 py-2 font-normal w-8"></th>
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
            {sorted.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`border-b border-white/3 hover:bg-white/2 cursor-pointer transition-all ${selectedId === c.id ? "bg-cyan-500/5" : ""
                  }`}
              >
                <td className="px-4 py-2.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(c.id) }}
                    className="cursor-pointer hover:scale-110 transition-transform"
                  >
                    <Star
                      className="w-3.5 h-3.5 transition-colors"
                      fill={isFavorite(c.id) ? "#facc15" : "none"}
                      stroke={isFavorite(c.id) ? "#facc15" : "#4b5563"}
                    />
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${statusColor(c.status)}`}
                    style={c.status === "unhealthy" ? { boxShadow: "0 0 6px rgba(251,191,36,0.5)" } : {}}
                  />
                </td>
                <td className="px-4 py-2.5 text-gray-200">
                  <Link to={`/containers/${encodeURIComponent(c.id)}`} className="hover:text-cyan-400 transition-colors">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-gray-500">{c.image}</td>
                <td className={`px-4 py-2.5 text-right ${cpuColor(c.cpuPercent)}`}>{c.cpuPercent}%</td>
                <td className={`px-4 py-2.5 text-right ${memColor(c.memoryPercent)}`}>{c.memoryMB}MB</td>
                <td className="px-4 py-2.5 text-right text-gray-400">
                  ↓{fmtMB(c.networkRxMB)} ↑{fmtMB(c.networkTxMB)}
                </td>
                <td className="px-4 py-2.5 text-gray-500">{c.host}</td>
                <td className="px-4 py-2.5 text-gray-500">{c.uptime}</td>
                <td className="px-4 py-2.5">
                  <Link to={`/containers/${encodeURIComponent(c.id)}`}>
                    <ChevronRight
                      className={`w-3 h-3 transition-colors ${selectedId === c.id ? "text-cyan-400" : "text-gray-700"
                        }`}
                    />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
