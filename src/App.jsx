import { useState, useMemo } from "react"
import { Routes, Route, Navigate } from "react-router"
import { Cpu, MemoryStick, Network, Container, HardDrive, Activity, Server, Thermometer } from "lucide-react"
import { DashboardProvider, useDashboard } from "./context/DashboardContext"
import { fmtMB } from "./Query"
import Sidebar from "./components/Sidebar"
import Topbar from "./components/Topbar"
import MetricsCard from "./components/MetricsCard"
import ContainerTable from "./components/ContainerTable"
import ContainersPage from "./components/ContainersPage"
import MetricsPage from "./components/MetricsPage"

export default function App() {
  return (
    <DashboardProvider>
      <AppShell />
    </DashboardProvider>
  )
}

function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(typeof window !== "undefined" && window.innerWidth < 768)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContainer, setSelectedContainer] = useState(null)

  const { containers, stats, hosts, refreshInterval, setRefreshInterval, error } = useDashboard()
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
        refreshInterval={refreshInterval}
        onIntervalChange={setRefreshInterval}
        stats={stats}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="relative z-20">
          <Topbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            refreshInterval={refreshInterval}
            onIntervalChange={setRefreshInterval}
            stats={stats}
            containers={containers}
            hosts={hosts}
            onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        <Routes>
          <Route path="/" element={
            <main className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-px bg-cyan-500/40" />
                  <span
                    className="text-cyan-400/60"
                    style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase" }}
                  >
                    DASHBOARD
                  </span>
                  <div className="w-20 h-px bg-cyan-500/20" />
                </div>
                <span
                  className="ml-auto text-gray-700"
                  style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
                >
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricsCard title="Containers" value={stats.total} subtitle={`${stats.running} active`} icon={<Container className="w-4 h-4" />} accentColor="#00f0ff" />
                {hosts.map((h) => (
                  <MetricsCard key={`${h.id}-cpu`} title={`${h.os} CPU`} value={`${h.cpuUsage}%`} subtitle={`${h.cpuCores} cores`} icon={<Cpu className="w-4 h-4" />} accentColor={h.id === 'linux' ? '#00f0ff' : '#818cf8'} />
                ))}
                {hosts.map((h) => (
                  <MetricsCard key={`${h.id}-mem`} title={`${h.os} RAM`} value={`${h.memUsedGB} GB`} subtitle={`${h.memPercent}% of ${h.memTotalGB} GB`} icon={<MemoryStick className="w-4 h-4" />} accentColor="#a855f7" />
                ))}
                <MetricsCard title="Network I/O" value={`${fmtMB(stats.totalNetworkRxMB + stats.totalNetworkTxMB)} MB/s`} subtitle={`↓${fmtMB(stats.totalNetworkRxMB)} ↑${fmtMB(stats.totalNetworkTxMB)}`} icon={<Network className="w-4 h-4" />} accentColor="#22d3ee" />
              </div>

              {selectedContainerData && (
                <ContainerDetail container={selectedContainerData} />
              )}

              <ContainerTable
                containers={containers}
                selectedId={selectedContainer}
                onSelect={(id) => setSelectedContainer(selectedContainer === id ? null : id)}
              />
            </main>
          } />
          <Route path="/containers" element={
            <div className="flex-1 overflow-hidden">
              <ContainersPage containers={containers} />
            </div>
          } />
          <Route path="/containers/:containerId" element={
            <div className="flex-1 overflow-hidden">
              <ContainersPage containers={containers} />
            </div>
          } />
          <Route path="/metrics" element={
            <div className="flex-1 overflow-y-auto">
              <MetricsPage />
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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
          {container.name}
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
        <DetailItem label="DISK R/W" value={`${fmtMB(container.diskReadMB)} / ${fmtMB(container.diskWriteMB)} MB/s`} />
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
