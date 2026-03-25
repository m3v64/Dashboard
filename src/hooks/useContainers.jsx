import { useMemo } from 'react'
import { useQueries, PromQL, formatUptime } from '../Query'

export function useContainers(interval = 30000) {
  const queries = useMemo(() => ({
    containers: PromQL.containers,
    cpuRate: PromQL.cpuRate,
    memoryUsage: PromQL.memoryUsage,
    memoryLimit: PromQL.memoryLimit,
    networkRx: PromQL.networkRx,
    networkTx: PromQL.networkTx,
    diskRead: PromQL.diskRead,
    diskWrite: PromQL.diskWrite,
    startTime: PromQL.startTime,
  }), [])

  const { data, error } = useQueries(queries, interval)

  const containers = useMemo(() => {
    const raw = data.containers ?? []
    if (raw.length === 0) return []

    const index = (results) => {
      const map = {}
      for (const r of results ?? []) {
        const id = r.metric?.id
        if (!id) continue

        if (!map[id]) {
          map[id] = r
        } else {
          const prev = parseFloat(map[id].value?.[1] ?? 0)
          const curr = parseFloat(r.value?.[1] ?? 0)
          map[id] = { ...r, value: [r.value?.[0], String(prev + curr)] }
        }
      }
      return map
    }

    const cpuMap = index(data.cpuRate)
    const memMap = index(data.memoryUsage)
    const memLimMap = index(data.memoryLimit)
    const netRxMap = index(data.networkRx)
    const netTxMap = index(data.networkTx)
    const diskRMap = index(data.diskRead)
    const diskWMap = index(data.diskWrite)
    const startMap = index(data.startTime)

    return raw.map((r) => {
      const id = r.metric?.id ?? r.metric?.name ?? 'unknown'
      const name = r.metric?.name ?? 'unknown'

      let image = r.metric?.image
      image = typeof image === 'string' ? image : ''
      if (image.length > 45) image = `${image.slice(0, 45)}...`

      const host = r.metric?.instance ?? r.metric?.job ?? ''

      const cpuPercent = parseVal(cpuMap[id], 1)
      const memoryBytes = parseVal(memMap[id], 0)
      const memoryMB = Math.round(memoryBytes / 1024 / 1024)
      const limitBytes = parseVal(memLimMap[id], 0)
      const memoryLimit = limitBytes > 0 ? Math.round(limitBytes / 1024 / 1024) : 0
      const memoryPercent = memoryLimit > 0 ? parseFloat(((memoryMB / memoryLimit) * 100).toFixed(1)) : 0
      const networkRxMB = parseVal(netRxMap[id], 0) / 1024 / 1024
      const networkTxMB = parseVal(netTxMap[id], 0) / 1024 / 1024
      const diskReadMB = parseVal(diskRMap[id], 0) / 1024 / 1024
      const diskWriteMB = parseVal(diskWMap[id], 0) / 1024 / 1024
      const startSeconds = parseVal(startMap[id], 0)
      const uptime = formatUptime(startSeconds)

      let status = 'stopped'
      if (cpuMap[id] || memMap[id]) {
        status = (cpuPercent > 90 || memoryPercent > 90) ? 'unhealthy' : 'running'
      }

      return {
        id,
        name,
        image,
        status,
        cpuPercent,
        memoryMB,
        memoryPercent,
        memoryLimit,
        networkRxMB: parseFloat(networkRxMB.toFixed(4)),
        networkTxMB: parseFloat(networkTxMB.toFixed(4)),
        diskReadMB: parseFloat(diskReadMB.toFixed(4)),
        diskWriteMB: parseFloat(diskWriteMB.toFixed(4)),
        uptime,
        host,
      }
    })
  }, [data])

  const stats = useMemo(() => {
    const defaults = {
      total: 0, running: 0, stopped: 0, unhealthy: 0,
      totalCpu: 0, avgCpu: 0,
      totalMemoryMB: 0, totalMemoryLimitMB: 0,
      totalNetworkRxMB: 0, totalNetworkTxMB: 0,
      totalDiskReadMB: 0, totalDiskWriteMB: 0,
    }
    if (containers.length === 0) return defaults
    const running = containers.filter((c) => c.status === 'running').length
    const stopped = containers.filter((c) => c.status === 'stopped').length
    const unhealthy = containers.filter((c) => c.status === 'unhealthy').length
    const totalCpu = containers.reduce((a, c) => a + c.cpuPercent, 0)
    const totalMem = containers.reduce((a, c) => a + c.memoryMB, 0)
    const totalMemLimit = containers.reduce((a, c) => a + c.memoryLimit, 0)
    const totalNetRx = containers.reduce((a, c) => a + c.networkRxMB, 0)
    const totalNetTx = containers.reduce((a, c) => a + c.networkTxMB, 0)
    const totalDiskR = containers.reduce((a, c) => a + c.diskReadMB, 0)
    const totalDiskW = containers.reduce((a, c) => a + c.diskWriteMB, 0)

    return {
      total: containers.length,
      running,
      stopped,
      unhealthy,
      totalCpu: parseFloat(totalCpu.toFixed(1)),
      avgCpu: parseFloat((totalCpu / containers.length).toFixed(1)),
      totalMemoryMB: totalMem,
      totalMemoryLimitMB: totalMemLimit,
      totalNetworkRxMB: parseFloat(totalNetRx.toFixed(3)),
      totalNetworkTxMB: parseFloat(totalNetTx.toFixed(3)),
      totalDiskReadMB: parseFloat(totalDiskR.toFixed(3)),
      totalDiskWriteMB: parseFloat(totalDiskW.toFixed(3)),
    }
  }, [containers])

  return { containers, stats, error }
}

function parseVal(result, decimals) {
  const raw = result?.value?.[1]
  if (raw === undefined || raw === null) return 0
  const num = parseFloat(raw)
  return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals))
}


