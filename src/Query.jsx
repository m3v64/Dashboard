import { useEffect, useState, useRef } from 'react'

const TS_PREFIX   = 'dash_ts_'
const MAX_POINTS  = 5000
const MAX_AGE_S   = 90 * 86400

function tsKey(query) {
  let h = 0x811c9dc5
  for (let i = 0; i < query.length; i++) {
    h ^= query.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return TS_PREFIX + (h >>> 0).toString(36)
}

function loadCache(query) {
  try {
    const raw = localStorage.getItem(tsKey(query))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveCache(query, series) {
  try {
    localStorage.setItem(tsKey(query), JSON.stringify(series))
  } catch { /* silently skip */ }
}

function mergeSeries(cached, fresh) {
  if (!cached || cached.length === 0) return fresh
  if (!fresh  || fresh.length  === 0) return cached

  const mkey     = (m) => JSON.stringify(m ?? {})
  const cacheMap = new Map(cached.map(s => [mkey(s.metric), s]))

  const merged = fresh.map(fs => {
    const key = mkey(fs.metric)
    const cs  = cacheMap.get(key)
    cacheMap.delete(key)

    if (!cs) return fs

    const byTs = new Map()
    for (const pt of cs.values ?? []) byTs.set(pt[0], pt)
    for (const pt of fs.values ?? []) byTs.set(pt[0], pt)

    const cutoff = Math.floor(Date.now() / 1000) - MAX_AGE_S
    const values = [...byTs.values()]
      .filter(p => p[0] >= cutoff)
      .sort((a, b) => a[0] - b[0])
      .slice(-MAX_POINTS)

    return { ...fs, values }
  })

  for (const [, cs] of cacheMap) {
    const cutoff = Math.floor(Date.now() / 1000) - MAX_AGE_S
    const values = (cs.values ?? [])
      .filter(p => p[0] >= cutoff)
      .sort((a, b) => a[0] - b[0])
      .slice(-MAX_POINTS)
    if (values.length > 0) merged.push({ ...cs, values })
  }

  return merged
}

export function clearTimeSeriesCache() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(TS_PREFIX)) keys.push(k)
  }
  keys.forEach(k => localStorage.removeItem(k))
}

export function useQueries(queries, interval = 15000) {
    const [data, setData] = useState({})
    const [error, setError] = useState(null)
    const queriesRef = useRef(queries)
    queriesRef.current = queries

    useEffect(() => {
        let cancelled = false

        async function fetchAll() {
            const current = queriesRef.current
            if (!current || Object.keys(current).length === 0) return

            try {
                const results = {}

                await Promise.all(
                    Object.entries(current).map(async ([key, query]) => {
                        const params = new URLSearchParams({ query })
                        const res = await fetch(`/api/v1/query?${params}`)
                        const json = await res.json()
                        results[key] = json.data?.result ?? []
                    })
                )

                if (!cancelled) {
                    setData(results)
                    setError(null)
                }
            } catch (err) {
                if (!cancelled) setError(err)
            }
        }

        fetchAll()
        if (!interval) return () => { cancelled = true }
        const id = setInterval(fetchAll, interval)
        return () => { cancelled = true; clearInterval(id) }
    }, [interval])

    return { data, error }
}

export function useRangeQuery(query, { start, end, step } = {}) {
    const [data, setData] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!query) return
        let cancelled = false

        async function fetchRange() {
            const now = Math.floor(Date.now() / 1000)
            const s = start ?? now - 3600
            const e = end   ?? now

            try {
                const params = new URLSearchParams({
                    query,
                    start: String(s),
                    end:   String(e),
                    step:  String(step ?? 60),
                })
                const res  = await fetch(`/api/v1/query_range?${params}`)
                const json = await res.json()

                if (!cancelled) {
                    const fresh  = json.data?.result ?? []
                    const cached = loadCache(query)
                    const merged = mergeSeries(cached, fresh)

                    saveCache(query, merged)

                    // filter to requested window for display
                    const display = merged.map(series => ({
                        ...series,
                        values: (series.values ?? []).filter(([ts]) => ts >= s && ts <= e),
                    }))

                    setData(display)
                    setError(null)
                }
            } catch (err) {
                if (!cancelled) {
                    // fall back to cached data when Prometheus is unreachable
                    const cached = loadCache(query)
                    if (cached) {
                        const display = cached.map(series => ({
                            ...series,
                            values: (series.values ?? []).filter(([ts]) => ts >= s && ts <= e),
                        }))
                        setData(display)
                    }
                    setError(err)
                }
            }
        }

        fetchRange()
        return () => { cancelled = true }
    }, [query, start, end, step])

    return { data, error }
}

export const PromQL = {
    containers:     'container_last_seen{name=~".+"}',
    cpuRate:        'rate(container_cpu_usage_seconds_total{name=~".+"}[1m]) * 100',
    memoryUsage:    'container_memory_working_set_bytes{name=~".+"}',
    memoryLimit:    'container_spec_memory_limit_bytes{name=~".+"}',
    networkRx:      'rate(container_network_receive_bytes_total{name=~".+"}[1m])',
    networkTx:      'rate(container_network_transmit_bytes_total{name=~".+"}[1m])',
    diskRead:       'rate(container_blkio_device_usage_total{name=~".+", operation="Read"}[1m])',
    diskWrite:      'rate(container_blkio_device_usage_total{name=~".+", operation="Write"}[1m])',
    startTime:      'container_start_time_seconds{name=~".+"}',

    cpuRange:       (name) => `rate(container_cpu_usage_seconds_total{name="${name}"}[1m]) * 100`,
    memoryRange:    (name) => `container_memory_working_set_bytes{name="${name}"}`,
    netRxRange:     (name) => `rate(container_network_receive_bytes_total{name="${name}"}[1m])`,
    netTxRange:     (name) => `rate(container_network_transmit_bytes_total{name="${name}"}[1m])`,
    diskReadRange:  (name) => `sum(rate(container_blkio_device_usage_total{name="${name}", operation="Read"}[1m]))`,
    diskWriteRange: (name) => `sum(rate(container_blkio_device_usage_total{name="${name}", operation="Write"}[1m]))`,

    cpuRangeAll:       'sum(rate(container_cpu_usage_seconds_total{name=~".+"}[1m])) * 100',
    memoryRangeAll:    'sum(container_memory_working_set_bytes{name=~".+"})',
    netRxRangeAll:     'sum(rate(container_network_receive_bytes_total{name=~".+"}[1m]))',
    netTxRangeAll:     'sum(rate(container_network_transmit_bytes_total{name=~".+"}[1m]))',
    diskReadRangeAll:  'sum(rate(container_blkio_device_usage_total{name=~".+", operation="Read"}[1m]))',
    diskWriteRangeAll: 'sum(rate(container_blkio_device_usage_total{name=~".+", operation="Write"}[1m]))',

    nodeMemTotal:       'node_memory_MemTotal_bytes',
    nodeMemAvailable:   'node_memory_MemAvailable_bytes',
    nodeLoad1:          'node_load1',
    nodeLoad5:          'node_load5',
    nodeLoad15:         'node_load15',
    nodeCpuCount:       'count(node_cpu_seconds_total{mode="idle"})',
    nodeCpuUsage:       '(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m]))) * 100',
    nodeFsSize:         'node_filesystem_size_bytes{fstype!~"tmpfs|overlay|squashfs",mountpoint!~"/boot.*"}',
    nodeFsAvail:        'node_filesystem_avail_bytes{fstype!~"tmpfs|overlay|squashfs",mountpoint!~"/boot.*"}',
    nodeBootTime:       'node_boot_time_seconds',
    nodeTemp:           'node_thermal_zone_temp{type="cpu-thermal"}',
    nodeUnameInfo:      'node_uname_info',

    nodeCpuRangeAll:    '(1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m]))) * 100',
    nodeMemUsedRange:   'node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes',
    nodeLoadRange:      'node_load1',

    winMemTotal:        'windows_memory_physical_total_bytes',
    winMemAvailable:    'windows_memory_available_bytes',
    winCpuUsage:        '(1 - avg(rate(windows_cpu_time_total{mode="idle"}[1m]))) * 100',
    winCpuCount:        'count(windows_cpu_time_total{mode="idle"})',
    winDiskSize:        'windows_logical_disk_size_bytes{volume=~"[A-Z]:"}',
    winDiskFree:        'windows_logical_disk_free_bytes{volume=~"[A-Z]:"}',
    winBootTime:        'windows_system_boot_time_timestamp',
    winOsInfo:          'windows_os_info',

    winCpuRangeAll:     '(1 - avg(rate(windows_cpu_time_total{mode="idle"}[1m]))) * 100',
    winMemUsedRange:    'windows_memory_physical_total_bytes - windows_memory_available_bytes',
}

export function fmtMB(v) {
    const n = Number(v)
    if (n >= 10) return Math.round(n).toString()
    if (n < 0.01) return "0"
    return n.toFixed(2)
}

export const TIME_RANGES = [
    { label: "15m", seconds: 900,      step: 15   },
    { label: "1h",  seconds: 3600,     step: 60   },
    // { label: "3h",  seconds: 10800,    step: 120  },
    { label: "6h",  seconds: 21600,    step: 240  },
    { label: "12h", seconds: 43200,    step: 300  },
    { label: "1d",  seconds: 86400,    step: 300  },
    // { label: "3d",  seconds: 259200,   step: 900  },
    { label: "7d",  seconds: 604800,   step: 1800 },
    // { label: "30d", seconds: 2592000,  step: 7200 },
    { label: "All", seconds: 7776000,  step: 21600},
]

export function formatUptime(timestamp) {
    if (!timestamp) return '—'
    const seconds = Math.floor(Date.now() / 1000 - timestamp)
    if (seconds < 0) return '—'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${mins}m`
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
}

export function toTimeSeries(results, valueKey = "value", divisor = 1) {
    if (!results?.[0]?.values) return []
    return results[0].values.map(([ts, val]) => ({
        time: new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        [valueKey]: parseFloat((parseFloat(val) / divisor).toFixed(2)),
    }))
}

export function mergeTimeSeries(results1, results2, key1, key2, divisor = 1) {
    const s1 = results1?.[0]?.values ?? []
    const s2 = results2?.[0]?.values ?? []
    const len = Math.max(s1.length, s2.length)
    const merged = []
    for (let i = 0; i < len; i++) {
        const ts = s1[i]?.[0] ?? s2[i]?.[0]
        merged.push({
            time: new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            [key1]: parseFloat((parseFloat(s1[i]?.[1] ?? 0) / divisor).toFixed(2)),
            [key2]: parseFloat((parseFloat(s2[i]?.[1] ?? 0) / divisor).toFixed(2)),
        })
    }
    return merged
}