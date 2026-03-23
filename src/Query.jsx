import { useEffect, useState, useRef } from 'react'

// Instant queries — fetches current values from /api/v1/query
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
        const id = setInterval(fetchAll, interval)
        return () => { cancelled = true; clearInterval(id) }
    }, [interval])

    return { data, error }
}

// Range queries — fetches time series from /api/v1/query_range
export function useRangeQuery(query, { start, end, step } = {}) {
    const [data, setData] = useState([])
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!query) return
        let cancelled = false

        async function fetchRange() {
            try {
                const now = Math.floor(Date.now() / 1000)
                const params = new URLSearchParams({
                    query,
                    start: String(start ?? now - 3600),
                    end: String(end ?? now),
                    step: String(step ?? 60),
                })
                const res = await fetch(`/api/v1/query_range?${params}`)
                const json = await res.json()
                if (!cancelled) {
                    setData(json.data?.result ?? [])
                    setError(null)
                }
            } catch (err) {
                if (!cancelled) setError(err)
            }
        }

        fetchRange()
        return () => { cancelled = true }
    }, [query, start, end, step])

    return { data, error }
}

// All PromQL queries used by the dashboard
export const PromQL = {
    // Instant queries for the container list
    containers:     'container_last_seen{name=~".+"}',
    cpuRate:        'rate(container_cpu_usage_seconds_total{name=~".+"}[1m]) * 100',
    memoryUsage:    'container_memory_usage_bytes{name=~".+"}',
    memoryLimit:    'container_spec_memory_limit_bytes{name=~".+"}',
    networkRx:      'rate(container_network_receive_bytes_total{name=~".+"}[1m])',
    networkTx:      'rate(container_network_transmit_bytes_total{name=~".+"}[1m])',
    diskRead:       'rate(container_fs_reads_bytes_total{name=~".+"}[1m])',
    diskWrite:      'rate(container_fs_writes_bytes_total{name=~".+"}[1m])',
    startTime:      'container_start_time_seconds{name=~".+"}',

    // Range queries for charts (parameterized by container name)
    cpuRange:       (name) => `rate(container_cpu_usage_seconds_total{name="${name}"}[1m]) * 100`,
    memoryRange:    (name) => `container_memory_usage_bytes{name="${name}"}`,
    netRxRange:     (name) => `rate(container_network_receive_bytes_total{name="${name}"}[1m])`,
    netTxRange:     (name) => `rate(container_network_transmit_bytes_total{name="${name}"}[1m])`,
    diskReadRange:  (name) => `rate(container_fs_reads_bytes_total{name="${name}"}[1m])`,
    diskWriteRange: (name) => `rate(container_fs_writes_bytes_total{name="${name}"}[1m])`,

    // Aggregate range queries for overview charts (sum across all containers)
    cpuRangeAll:       'sum(rate(container_cpu_usage_seconds_total{name=~".+"}[1m])) * 100',
    memoryRangeAll:    'sum(container_memory_usage_bytes{name=~".+"})',
    netRxRangeAll:     'sum(rate(container_network_receive_bytes_total{name=~".+"}[1m]))',
    netTxRangeAll:     'sum(rate(container_network_transmit_bytes_total{name=~".+"}[1m]))',
    diskReadRangeAll:  'sum(rate(container_fs_reads_bytes_total{name=~".+"}[1m]))',
    diskWriteRangeAll: 'sum(rate(container_fs_writes_bytes_total{name=~".+"}[1m]))',
}

// Transform Prometheus range result into recharts-compatible array
export function toTimeSeries(results, valueKey = "value", divisor = 1) {
    if (!results?.[0]?.values) return []
    return results[0].values.map(([ts, val]) => ({
        time: new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        [valueKey]: parseFloat((parseFloat(val) / divisor).toFixed(2)),
    }))
}

// Merge two range query results into one time series (e.g., rx + tx)
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