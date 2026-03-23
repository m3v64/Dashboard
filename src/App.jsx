import { useState, useEffect, useMemo } from "react"
import { Cpu, MemoryStick, Network, Container, HardDrive, Activity } from "lucide-react"
import { useContainers } from "./hooks/useContainers"
import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import MetricsCard from "./components/MetricsCard"
import ContainerTable from "./components/ContainerTable"
import ChartsPanel from "./components/ChartsPanel"
import ContainersPage from "./components/ContainersPage"

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeView, setActiveView] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContainer, setSelectedContainer] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [tick, setTick] = useState(0)

  const { containers, stats, error } = useContainers(autoRefresh ? 15000 : null)

  useEffect(() => {
    if (!autoRefresh) return
    const id = setInterval(() => setTick((t) => t + 1), 15000)
    return () => clearInterval(id)
  }, [autoRefresh])

  const filteredContainers = useMemo(
    () => containers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.image.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [containers, searchQuery]
  )

  const selectedContainerData = containers.find((c) => c.id === selectedContainer)

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #06080e 0%, #0a0c14 50%, #080a12 100%)",
        fontFamily: "Inter, sans-serif",
        color: "#e5e7eb",
      }}
    >
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
          stats={stats}
          containerCount={containers.length}
        />

        {activeView === "containers" ? (
          <div className="flex-1 overflow-hidden">
            <ContainersPage containers={containers} />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-px bg-cyan-500/40" />
                <span
                  className="text-cyan-400/60"
                  style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase" }}
                >
                  PRISM//DASHBOARD
                </span>
                <div className="w-20 h-px bg-cyan-500/20" />
              </div>
              <span
                className="ml-auto text-gray-700"
                style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
              >
                TICK:{tick} // {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricsCard title="Containers" value={stats.total} subtitle={`${stats.running} active`} icon={<Container className="w-4 h-4" />} accentColor="#00f0ff" />
              <MetricsCard title="Avg CPU" value={`${stats.avgCpu}%`} subtitle="across all containers" icon={<Cpu className="w-4 h-4" />} accentColor="#00f0ff" />
              <MetricsCard title="Total Memory" value={`${(stats.totalMemoryMB / 1024).toFixed(1)}GB`} subtitle={`of ${(stats.totalMemoryLimitMB / 1024).toFixed(1)}GB allocated`} icon={<MemoryStick className="w-4 h-4" />} accentColor="#a855f7" />
              <MetricsCard title="Network RX" value={`${(stats.totalNetworkRxMB / 1024).toFixed(1)}GB`} subtitle="total received" icon={<Network className="w-4 h-4" />} accentColor="#22d3ee" />
              <MetricsCard title="Network TX" value={`${(stats.totalNetworkTxMB / 1024).toFixed(1)}GB`} subtitle="total transmitted" icon={<Activity className="w-4 h-4" />} accentColor="#f97316" />
              <MetricsCard title="Disk I/O" value={`${(stats.totalDiskReadMB + stats.totalDiskWriteMB).toFixed(0)}MB`} subtitle={`R:${stats.totalDiskReadMB.toFixed(0)} / W:${stats.totalDiskWriteMB.toFixed(0)}MB`} icon={<HardDrive className="w-4 h-4" />} accentColor="#34d399" />
            </div>

            {/* Charts */}
            <ChartsPanel
              key={tick}
              containerId={selectedContainer}
              containerName={selectedContainerData?.name ?? "All Containers"}
            />

            {/* Container table */}
            <ContainerTable
              containers={filteredContainers}
              selectedId={selectedContainer}
              onSelect={(id) => setSelectedContainer(selectedContainer === id ? null : id)}
            />

            {/* Selected container detail */}
            {selectedContainerData && (
              <ContainerDetail container={selectedContainerData} />
            )}
          </main>
        )}
      </div>
    </div>
  )
}

function ContainerDetail({ container }) {
  return (
    <div
      className="rounded-lg p-5 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)",
        border: "1px solid rgba(0,240,255,0.08)",
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-px"
        style={{ background: "linear-gradient(90deg, #00f0ff, transparent 50%)" }}
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
        <span
          className="uppercase tracking-wider text-gray-300"
          style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}
        >
          {container.name} // Detail
        </span>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
        style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}
      >
        <DetailItem label="IMAGE" value={container.image} />
        <DetailItem
          label="STATUS"
          value={container.status.toUpperCase()}
          valueColor={container.status === "running" ? "#34d399" : container.status === "unhealthy" ? "#fbbf24" : "#f87171"}
        />
        <DetailItem label="CPU" value={`${container.cpuPercent}%`} />
        <DetailItem label="MEMORY" value={`${container.memoryMB}MB / ${container.memoryLimit}MB`} />
        <DetailItem label="DISK R/W" value={`${container.diskReadMB}MB / ${container.diskWriteMB}MB`} />
        <DetailItem label="HOST" value={container.host} />
        <DetailItem label="UPTIME" value={container.uptime} />
      </div>

      {/* Memory bar */}
      <div className="mt-4">
        <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          <span className="text-gray-500">MEMORY UTILIZATION</span>
          <span className="text-purple-400">{container.memoryPercent}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${container.memoryPercent}%`,
              background: container.memoryPercent > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #a855f7, #7c3aed)",
              boxShadow: "0 0 8px rgba(168,85,247,0.4)",
            }}
          />
        </div>
      </div>

      {/* CPU bar */}
      <div className="mt-3">
        <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
          <span className="text-gray-500">CPU UTILIZATION</span>
          <span className="text-cyan-400">{container.cpuPercent}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-white/5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(container.cpuPercent, 100)}%`,
              background: container.cpuPercent > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #00f0ff, #0ea5e9)",
              boxShadow: "0 0 8px rgba(0,240,255,0.4)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

function DetailItem({ label, value, valueColor }) {
  return (
    <div>
      <div className="mb-0.5 text-gray-600" style={{ fontSize: "10px" }}>{label}</div>
      <div style={{ color: valueColor ?? "#d1d5db" }}>{value}</div>
    </div>
  )
}
