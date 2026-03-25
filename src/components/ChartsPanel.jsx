import { PromQL } from "../Query"
import RangeChartCard from "./RangeChartCard"

const MB = 1024 * 1024

export default function ChartsPanel({ containerName }) {
  const name = containerName && containerName !== "All Containers" ? containerName : null
  const cpuQuery = name ? PromQL.cpuRange(name) : PromQL.cpuRangeAll
  const memQuery = name ? PromQL.memoryRange(name) : PromQL.memoryRangeAll
  const rxQuery = name ? PromQL.netRxRange(name) : PromQL.netRxRangeAll
  const txQuery = name ? PromQL.netTxRange(name) : PromQL.netTxRangeAll
  const diskReadQuery = name ? PromQL.diskReadRange(name) : PromQL.diskReadRangeAll
  const diskWriteQuery = name ? PromQL.diskWriteRange(name) : PromQL.diskWriteRangeAll

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
        <RangeChartCard
          title="CPU Usage (%)"
          series={[{ query: cpuQuery, dataKey: "value", name: "CPU %", color: "#00f0ff", gradientId: "cpuGrad" }]}
          yDomain={[0, 100]}
          height={180}
        />
        <RangeChartCard
          title="Memory Usage (MB)"
          series={[{ query: memQuery, dataKey: "value", name: "Memory MB", color: "#a855f7", gradientId: "memGrad" }]}
          divisor={MB}
          height={180}
        />
        <RangeChartCard
          title="Network Traffic (MB/s)"
          series={[
            { query: rxQuery, dataKey: "rx", name: "RX", color: "#22d3ee", gradientId: "rxGrad" },
            { query: txQuery, dataKey: "tx", name: "TX", color: "#f97316", gradientId: "txGrad" },
          ]}
          divisor={MB}
          height={180}
        />
        <RangeChartCard
          title="Disk I/O (MB/s)"
          type="line"
          series={[
            { query: diskReadQuery, dataKey: "read", name: "READ", color: "#34d399", gradientId: "readGrad" },
            { query: diskWriteQuery, dataKey: "write", name: "WRITE", color: "#fb7185", gradientId: "writeGrad" },
          ]}
          divisor={MB}
          height={180}
        />
      </div>
    </div>
  )
}
