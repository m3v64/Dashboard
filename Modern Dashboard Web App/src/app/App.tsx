import { useState, useEffect, useMemo } from "react";
import { Cpu, MemoryStick, Network, Container, HardDrive, Activity } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { MetricsCard } from "./components/MetricsCard";
import { ContainerTable } from "./components/ContainerTable";
import { ChartsPanel } from "./components/ChartsPanel";
import { ContainersPage } from "./components/ContainersPage";
import {
  containers as allContainers,
  totalCpu,
  totalMemoryMB,
  totalMemoryLimitMB,
  totalNetworkRx,
  totalNetworkTx,
  runningCount,
} from "./components/mock-data";

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredContainers = useMemo(
    () =>
      allContainers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.image.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  const selectedContainerData = allContainers.find((c) => c.id === selectedContainer);
  const avgCpu = (totalCpu / allContainers.length).toFixed(1);
  const dm = darkMode;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: dm
          ? "linear-gradient(135deg, #06080e 0%, #0a0c14 50%, #080a12 100%)"
          : "linear-gradient(135deg, #f0f2f5 0%, #e8eaf0 100%)",
        fontFamily: "Inter, sans-serif",
        color: dm ? "#e5e7eb" : "#1f2937",
      }}
    >
      {dm && (
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        darkMode={dm}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          autoRefresh={autoRefresh}
          onAutoRefreshToggle={() => setAutoRefresh(!autoRefresh)}
          darkMode={dm}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
        />

        {/* Containers page - full height, no padding (it manages its own layout) */}
        {activeView === "containers" ? (
          <div className="flex-1 overflow-hidden">
            <ContainersPage darkMode={dm} />
          </div>
        ) : (
          /* Dashboard and other views */
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Decorative header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-[1px] ${dm ? "bg-cyan-500/40" : "bg-cyan-500/30"}`} />
                <span
                  className={dm ? "text-cyan-400/60" : "text-cyan-600/60"}
                  style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", letterSpacing: "0.3em", textTransform: "uppercase" }}
                >
                  PRISM//DASHBOARD
                </span>
                <div className={`w-20 h-[1px] ${dm ? "bg-cyan-500/20" : "bg-cyan-500/15"}`} />
              </div>
              <span
                className={`ml-auto ${dm ? "text-gray-700" : "text-gray-400"}`}
                style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}
              >
                TICK:{tick} // {new Date().toLocaleTimeString()}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <MetricsCard darkMode={dm} title="Containers" value={allContainers.length} subtitle={`${runningCount} active`} icon={<Container className="w-4 h-4" />} accentColor="#00f0ff" trend={{ value: 2, label: "" }} />
              <MetricsCard darkMode={dm} title="Avg CPU" value={`${avgCpu}%`} subtitle="across all containers" icon={<Cpu className="w-4 h-4" />} accentColor="#00f0ff" trend={{ value: -3.2, label: "" }} />
              <MetricsCard darkMode={dm} title="Total Memory" value={`${(totalMemoryMB / 1024).toFixed(1)}GB`} subtitle={`of ${(totalMemoryLimitMB / 1024).toFixed(1)}GB allocated`} icon={<MemoryStick className="w-4 h-4" />} accentColor="#a855f7" trend={{ value: 5.1, label: "" }} />
              <MetricsCard darkMode={dm} title="Network RX" value={`${(totalNetworkRx / 1024).toFixed(1)}GB`} subtitle="total received" icon={<Network className="w-4 h-4" />} accentColor="#22d3ee" />
              <MetricsCard darkMode={dm} title="Network TX" value={`${(totalNetworkTx / 1024).toFixed(1)}GB`} subtitle="total transmitted" icon={<Activity className="w-4 h-4" />} accentColor="#f97316" />
              <MetricsCard darkMode={dm} title="Disk Usage" value="1.2TB" subtitle="of 4TB total" icon={<HardDrive className="w-4 h-4" />} accentColor="#34d399" trend={{ value: 1.8, label: "" }} />
            </div>

            {/* Charts */}
            <ChartsPanel
              key={tick}
              containerId={selectedContainer}
              containerName={selectedContainerData?.name ?? "All Containers"}
              darkMode={dm}
            />

            {/* Container Table */}
            <ContainerTable
              containers={filteredContainers}
              selectedId={selectedContainer}
              onSelect={(id) => setSelectedContainer(selectedContainer === id ? null : id)}
              darkMode={dm}
            />

            {/* Selected container detail panel */}
            {selectedContainerData && (
              <div
                className="rounded-lg p-5 relative overflow-hidden"
                style={{
                  background: dm
                    ? "linear-gradient(135deg, rgba(15,18,28,0.95) 0%, rgba(10,12,20,0.9) 100%)"
                    : "#ffffff",
                  border: dm ? "1px solid rgba(0,240,255,0.08)" : "1px solid #e5e7eb",
                }}
              >
                <div
                  className="absolute top-0 left-0 w-full h-[1px]"
                  style={{ background: "linear-gradient(90deg, #00f0ff, transparent 50%)" }}
                />
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-cyan-400 rounded" style={{ boxShadow: "0 0 8px rgba(0,240,255,0.4)" }} />
                  <span
                    className={`uppercase tracking-wider ${dm ? "text-gray-300" : "text-gray-600"}`}
                    style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px" }}
                  >
                    {selectedContainerData.name} // Detail
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "12px" }}>
                  <DetailItem label="IMAGE" value={selectedContainerData.image} darkMode={dm} />
                  <DetailItem label="STATUS" value={selectedContainerData.status.toUpperCase()} darkMode={dm} valueColor={selectedContainerData.status === "running" ? "#34d399" : selectedContainerData.status === "unhealthy" ? "#fbbf24" : "#f87171"} />
                  <DetailItem label="CPU" value={`${selectedContainerData.cpuPercent}%`} darkMode={dm} />
                  <DetailItem label="MEMORY" value={`${selectedContainerData.memoryMB}MB / ${selectedContainerData.memoryLimit}MB`} darkMode={dm} />
                  <DetailItem label="DISK R/W" value={`${selectedContainerData.diskReadMB}MB / ${selectedContainerData.diskWriteMB}MB`} darkMode={dm} />
                  <DetailItem label="HOST" value={selectedContainerData.host} darkMode={dm} />
                  <DetailItem label="UPTIME" value={selectedContainerData.uptime} darkMode={dm} />
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                    <span className={dm ? "text-gray-500" : "text-gray-400"}>MEMORY UTILIZATION</span>
                    <span className="text-purple-400">{selectedContainerData.memoryPercent}%</span>
                  </div>
                  <div className={`h-1 rounded-full overflow-hidden ${dm ? "bg-white/5" : "bg-gray-200"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${selectedContainerData.memoryPercent}%`,
                        background: selectedContainerData.memoryPercent > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #a855f7, #7c3aed)",
                        boxShadow: dm ? "0 0 8px rgba(168,85,247,0.4)" : "none",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between mb-1" style={{ fontFamily: "Share Tech Mono, monospace", fontSize: "10px" }}>
                    <span className={dm ? "text-gray-500" : "text-gray-400"}>CPU UTILIZATION</span>
                    <span className="text-cyan-400">{selectedContainerData.cpuPercent}%</span>
                  </div>
                  <div className={`h-1 rounded-full overflow-hidden ${dm ? "bg-white/5" : "bg-gray-200"}`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(selectedContainerData.cpuPercent, 100)}%`,
                        background: selectedContainerData.cpuPercent > 80 ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #00f0ff, #0ea5e9)",
                        boxShadow: dm ? "0 0 8px rgba(0,240,255,0.4)" : "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Prometheus config hint */}
            <div
              className="rounded-lg p-4 mt-4"
              style={{
                background: dm ? "rgba(15,18,28,0.6)" : "rgba(249,250,251,0.8)",
                border: dm ? "1px solid rgba(0,240,255,0.04)" : "1px solid #e5e7eb",
                fontFamily: "Share Tech Mono, monospace",
                fontSize: "11px",
              }}
            >
              <span className={dm ? "text-gray-600" : "text-gray-400"}>// PROMETHEUS ENDPOINT: </span>
              <span className={dm ? "text-cyan-500/50" : "text-cyan-600/60"}>http://your-prometheus:9090/api/v1/query</span>
              <br />
              <span className={dm ? "text-gray-600" : "text-gray-400"}>// QUERIES: </span>
              <span className="text-gray-500">rate(container_cpu_usage_seconds_total[1m]) | container_memory_usage_bytes</span>
              <br />
              <span className={dm ? "text-gray-600" : "text-gray-400"}>// STATUS: </span>
              <span className={dm ? "text-amber-500/60" : "text-amber-600/70"}>USING MOCK DATA — connect Prometheus to enable live metrics</span>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

function DetailItem({ label, value, valueColor, darkMode }) {
  return (
    <div>
      <div className={`mb-0.5 ${darkMode ? "text-gray-600" : "text-gray-400"}`} style={{ fontSize: "10px" }}>{label}</div>
      <div style={{ color: valueColor ?? (darkMode ? "#d1d5db" : "#374151") }}>{value}</div>
    </div>
  );
}
