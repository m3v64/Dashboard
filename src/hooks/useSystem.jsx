import { useMemo } from 'react'
import { useQueries, PromQL } from '../Query'

const GB = 1024 * 1024 * 1024

export function useSystem(interval = 15000) {
  const queries = useMemo(() => ({
    nodeMemTotal:     PromQL.nodeMemTotal,
    nodeMemAvailable: PromQL.nodeMemAvailable,
    nodeCpuUsage:     PromQL.nodeCpuUsage,
    nodeCpuCount:     PromQL.nodeCpuCount,
    nodeLoad1:        PromQL.nodeLoad1,
    nodeLoad5:        PromQL.nodeLoad5,
    nodeLoad15:       PromQL.nodeLoad15,
    nodeFsSize:       PromQL.nodeFsSize,
    nodeFsAvail:      PromQL.nodeFsAvail,
    nodeBootTime:     PromQL.nodeBootTime,
    nodeTemp:         PromQL.nodeTemp,
    nodeUnameInfo:    PromQL.nodeUnameInfo,

    winMemTotal:      PromQL.winMemTotal,
    winMemAvailable:  PromQL.winMemAvailable,
    winCpuUsage:      PromQL.winCpuUsage,
    winCpuCount:      PromQL.winCpuCount,
    winDiskSize:      PromQL.winDiskSize,
    winDiskFree:      PromQL.winDiskFree,
    winBootTime:      PromQL.winBootTime,
    winOsInfo:        PromQL.winOsInfo,
  }), [])

  const { data, error } = useQueries(queries, interval)

  const hosts = useMemo(() => {
    const result = []

    const nodeMemTotalB = val(data.nodeMemTotal)
    const nodeMemAvailB = val(data.nodeMemAvailable)
    if (nodeMemTotalB > 0) {
      const memUsedB = nodeMemTotalB - nodeMemAvailB
      const uname = data.nodeUnameInfo?.[0]?.metric ?? {}

      const filesystems = (data.nodeFsSize ?? []).map((fs) => {
        const mp = fs.metric?.mountpoint ?? '/'
        const dev = fs.metric?.device ?? ''
        const sizeB = parseFloat(fs.value?.[1] ?? 0)
        const availB = parseFloat(
          (data.nodeFsAvail ?? []).find((a) => a.metric?.mountpoint === mp)?.value?.[1] ?? 0
        )
        return {
          mountpoint: mp,
          device: dev,
          sizeGB: parseFloat((sizeB / GB).toFixed(2)),
          usedGB: parseFloat(((sizeB - availB) / GB).toFixed(2)),
          availGB: parseFloat((availB / GB).toFixed(2)),
          usedPercent: sizeB > 0 ? parseFloat(((1 - availB / sizeB) * 100).toFixed(1)) : 0,
        }
      })

      result.push({
        id: 'linux',
        name: uname.nodename || 'Linux Host',
        os: `${uname.sysname ?? 'Linux'} ${uname.release ?? ''}`.trim(),
        arch: uname.machine ?? '',
        cpuUsage: val1(data.nodeCpuUsage),
        cpuCores: Math.round(val(data.nodeCpuCount)),
        load1: val1(data.nodeLoad1),
        load5: val1(data.nodeLoad5),
        load15: val1(data.nodeLoad15),
        memTotalGB: parseFloat((nodeMemTotalB / GB).toFixed(2)),
        memUsedGB: parseFloat((memUsedB / GB).toFixed(2)),
        memPercent: parseFloat(((memUsedB / nodeMemTotalB) * 100).toFixed(1)),
        temp: val1(data.nodeTemp) || null,
        uptime: formatUptime(val(data.nodeBootTime)),
        filesystems,
      })
    }

    const winMemTotalB = val(data.winMemTotal)
    const winMemAvailB = val(data.winMemAvailable)
    if (winMemTotalB > 0) {
      const memUsedB = winMemTotalB - winMemAvailB
      const osInfo = data.winOsInfo?.[0]?.metric ?? {}

      const volumes = (data.winDiskSize ?? []).map((d) => {
        const vol = d.metric?.volume ?? ''
        const sizeB = parseFloat(d.value?.[1] ?? 0)
        const freeB = parseFloat(
          (data.winDiskFree ?? []).find((f) => f.metric?.volume === vol)?.value?.[1] ?? 0
        )
        return {
          mountpoint: vol,
          device: vol,
          sizeGB: parseFloat((sizeB / GB).toFixed(2)),
          usedGB: parseFloat(((sizeB - freeB) / GB).toFixed(2)),
          availGB: parseFloat((freeB / GB).toFixed(2)),
          usedPercent: sizeB > 0 ? parseFloat(((1 - freeB / sizeB) * 100).toFixed(1)) : 0,
        }
      })

      result.push({
        id: 'windows',
        name: osInfo.product || 'Windows Host',
        os: `${osInfo.product ?? 'Windows'} (${osInfo.version ?? ''})`,
        arch: 'x86_64',
        cpuUsage: val1(data.winCpuUsage),
        cpuCores: Math.round(val(data.winCpuCount)),
        load1: null,
        load5: null,
        load15: null,
        memTotalGB: parseFloat((winMemTotalB / GB).toFixed(2)),
        memUsedGB: parseFloat((memUsedB / GB).toFixed(2)),
        memPercent: parseFloat(((memUsedB / winMemTotalB) * 100).toFixed(1)),
        temp: null,
        uptime: formatUptime(val(data.winBootTime)),
        filesystems: volumes,
      })
    }

    return result
  }, [data])

  return { hosts, error }
}

function val(results) {
  return parseFloat(results?.[0]?.value?.[1] ?? 0) || 0
}

function val1(results) {
  const v = val(results)
  return parseFloat(v.toFixed(1))
}

function formatUptime(bootTimestamp) {
  if (!bootTimestamp) return '—'
  const seconds = Math.floor(Date.now() / 1000 - bootTimestamp)
  if (seconds < 0) return '—'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
