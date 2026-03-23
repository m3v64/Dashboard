// Mock data for development — replace with live Prometheus queries

export const containers = [
  { id: "c1", name: "nginx-proxy", image: "nginx:1.25", status: "running", cpuPercent: 12.4, memoryMB: 256, memoryPercent: 25, memoryLimit: 1024, networkRxMB: 142.5, networkTxMB: 89.3, diskReadMB: 12.1, diskWriteMB: 3.4, uptime: "14d 6h 32m", host: "host-01" },
  { id: "c2", name: "api-gateway", image: "node:20-alpine", status: "running", cpuPercent: 34.7, memoryMB: 512, memoryPercent: 50, memoryLimit: 1024, networkRxMB: 298.1, networkTxMB: 201.7, diskReadMB: 45.2, diskWriteMB: 18.9, uptime: "7d 12h 15m", host: "host-01" },
  { id: "c3", name: "postgres-db", image: "postgres:16", status: "running", cpuPercent: 22.1, memoryMB: 1024, memoryPercent: 50, memoryLimit: 2048, networkRxMB: 85.4, networkTxMB: 112.6, diskReadMB: 234.5, diskWriteMB: 167.8, uptime: "30d 2h 45m", host: "host-01" },
  { id: "c4", name: "redis-cache", image: "redis:7-alpine", status: "running", cpuPercent: 5.2, memoryMB: 128, memoryPercent: 25, memoryLimit: 512, networkRxMB: 67.2, networkTxMB: 54.1, diskReadMB: 2.1, diskWriteMB: 8.7, uptime: "30d 2h 45m", host: "host-01" },
  { id: "c5", name: "worker-queue", image: "python:3.12", status: "running", cpuPercent: 67.8, memoryMB: 768, memoryPercent: 75, memoryLimit: 1024, networkRxMB: 34.5, networkTxMB: 22.1, diskReadMB: 56.3, diskWriteMB: 89.1, uptime: "3d 18h 22m", host: "host-02" },
  { id: "c6", name: "monitoring-agent", image: "grafana/agent:latest", status: "running", cpuPercent: 8.9, memoryMB: 192, memoryPercent: 37.5, memoryLimit: 512, networkRxMB: 445.2, networkTxMB: 123.4, diskReadMB: 12.3, diskWriteMB: 5.6, uptime: "14d 6h 32m", host: "host-02" },
  { id: "c7", name: "frontend-app", image: "node:20-alpine", status: "unhealthy", cpuPercent: 89.3, memoryMB: 896, memoryPercent: 87.5, memoryLimit: 1024, networkRxMB: 567.8, networkTxMB: 345.2, diskReadMB: 23.4, diskWriteMB: 12.1, uptime: "1d 4h 11m", host: "host-02" },
  { id: "c8", name: "cadvisor-01", image: "gcr.io/cadvisor:v0.47", status: "running", cpuPercent: 3.1, memoryMB: 64, memoryPercent: 12.5, memoryLimit: 512, networkRxMB: 12.3, networkTxMB: 45.6, diskReadMB: 1.2, diskWriteMB: 0.8, uptime: "30d 2h 45m", host: "host-01" },
  { id: "c9", name: "cadvisor-02", image: "gcr.io/cadvisor:v0.47", status: "running", cpuPercent: 2.8, memoryMB: 58, memoryPercent: 11.3, memoryLimit: 512, networkRxMB: 11.1, networkTxMB: 42.3, diskReadMB: 1.1, diskWriteMB: 0.7, uptime: "30d 2h 45m", host: "host-02" },
  { id: "c10", name: "log-collector", image: "fluent/fluentd:v1.16", status: "stopped", cpuPercent: 0, memoryMB: 0, memoryPercent: 0, memoryLimit: 512, networkRxMB: 0, networkTxMB: 0, diskReadMB: 0, diskWriteMB: 0, uptime: "—", host: "host-02" },
]

function generateTimeSeries(baseValue, variance, points = 30) {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => {
    const time = new Date(now - (points - 1 - i) * 60000)
    const val = Math.max(0, baseValue + (Math.random() - 0.5) * variance * 2)
    return {
      time: `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
      value: parseFloat(val.toFixed(1)),
    }
  })
}

export function getCpuTimeSeries(containerId) {
  const c = containers.find((x) => x.id === containerId)
  return generateTimeSeries(c?.cpuPercent ?? 20, 15)
}

export function getMemoryTimeSeries(containerId) {
  const c = containers.find((x) => x.id === containerId)
  return generateTimeSeries(c?.memoryMB ?? 256, 100)
}

export function getNetworkTimeSeries(containerId) {
  const now = Date.now()
  return Array.from({ length: 30 }, (_, i) => {
    const time = new Date(now - (29 - i) * 60000)
    return {
      time: `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`,
      rx: parseFloat((Math.random() * 50 + 10).toFixed(1)),
      tx: parseFloat((Math.random() * 30 + 5).toFixed(1)),
    }
  })
}

export const totalCpu = parseFloat(containers.reduce((a, c) => a + c.cpuPercent, 0).toFixed(1))
export const totalMemoryMB = containers.reduce((a, c) => a + c.memoryMB, 0)
export const totalMemoryLimitMB = containers.reduce((a, c) => a + c.memoryLimit, 0)
export const totalNetworkRx = parseFloat(containers.reduce((a, c) => a + c.networkRxMB, 0).toFixed(1))
export const totalNetworkTx = parseFloat(containers.reduce((a, c) => a + c.networkTxMB, 0).toFixed(1))
export const runningCount = containers.filter((c) => c.status === "running").length
export const stoppedCount = containers.filter((c) => c.status === "stopped").length
export const unhealthyCount = containers.filter((c) => c.status === "unhealthy").length
