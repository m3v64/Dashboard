import { useCallback, useEffect, useMemo, useState } from 'react'

const PROM_QUERY = 'container_last_seen{job=~"cadvisor_.*"}'

function cleanContainerName(rawName) {
    if (!rawName) {
        return 'unnamed'
    }

    return rawName.startsWith('/') ? rawName.slice(1) : rawName
}

function normalizePromSeries(series) {
    const metric = series.metric ?? {}
    const rawName =
        metric.name ??
        metric.container ??
        metric.container_name ??
        metric.container_label_io_kubernetes_container_name ??
        metric.id

    const timestamp = Number(series.value?.[0])

    return {
        id: metric.id ?? `${metric.instance}-${rawName}`,
        name: cleanContainerName(rawName),
        image: metric.image ?? metric.container_label_io_kubernetes_container_image ?? 'unknown image',
        job: metric.job ?? 'unknown job',
        instance: metric.instance ?? 'unknown instance',
        lastSeen: Number.isFinite(timestamp)
            ? new Date(timestamp * 1000).toLocaleString()
            : 'n/a',
    }
}

function Container() {
    const [containers, setContainers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [lastUpdated, setLastUpdated] = useState('')

    const loadContainers = useCallback(async () => {
        try {
            setError('')

            const params = new URLSearchParams({ query: PROM_QUERY })
            const response = await fetch(`/api/v1/query?${params.toString()}`)

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`)
            }

            const json = await response.json()

            if (json.status !== 'success') {
                throw new Error('Prometheus did not return success status.')
            }

            const rows = (json.data?.result ?? [])
                .map(normalizePromSeries)
                .filter((container) => container.name !== 'POD' && container.name !== '')
                .sort((a, b) => {
                    const byInstance = a.instance.localeCompare(b.instance)
                    if (byInstance !== 0) {
                        return byInstance
                    }

                    return a.name.localeCompare(b.name)
                })

            setContainers(rows)
            setLastUpdated(new Date().toLocaleTimeString())
        } catch (fetchError) {
            setError(fetchError instanceof Error ? fetchError.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadContainers()
        const intervalId = window.setInterval(loadContainers, 15000)

        return () => {
            window.clearInterval(intervalId)
        }
    }, [loadContainers])

    const groupedByInstance = useMemo(() => {
        return containers.reduce((accumulator, container) => {
            const key = container.instance
            accumulator[key] = accumulator[key] ?? []
            accumulator[key].push(container)
            return accumulator
        }, {})
    }, [containers])

    const instances = Object.entries(groupedByInstance)

    return (
        <section className="container-dashboard">
            <header className="dashboard-header">
                <h1>Docker Containers</h1>
                <div className="dashboard-meta">
                    <span>Detected: {containers.length}</span>
                    <span>Updated: {lastUpdated || 'waiting...'}</span>
                    <button type="button" onClick={loadContainers}>Refresh</button>
                </div>
            </header>

            {loading && <p className="state-message">Loading containers...</p>}
            {error && <p className="state-message error">Failed to load: {error}</p>}

            {!loading && !error && instances.length === 0 && (
                <p className="state-message">No containers were reported by cadvisor jobs yet.</p>
            )}

            {instances.map(([instance, instanceContainers]) => (
                <section className="instance-group" key={instance}>
                    <h2>{instance} ({instanceContainers.length})</h2>
                    <div className="container-grid">
                        {instanceContainers.map((container) => (
                            <article className="container-card" key={`${container.id}-${container.instance}`}>
                                <h3>{container.name}</h3>
                                <p><strong>Image:</strong> {container.image}</p>
                                <p><strong>Job:</strong> {container.job}</p>
                                <p><strong>Last Seen:</strong> {container.lastSeen}</p>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </section>
    )
}

export default Container