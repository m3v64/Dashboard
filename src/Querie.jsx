import { useEffect, useState } from 'react'

export function useQueries(queries, interval = 15000) {
    const [data, setData] = useState({})
    const [error, setError] = useState(null)

    useEffect(() => {
        async function fetchAll() {
            try {
                setError(null)
                const results = {}

                await Promise.all(
                    Object.entries(queries ?? {}).map(async ([key, query]) => {
                        const params = new URLSearchParams({ query })
                        const res = await fetch(`/api/v1/query?${params}`)
                        const json = await res.json()

                        results[key] = json.data?.result ?? []
                    })
                )

                console.log('Prometheus results:', results)
                setData(results)
            } catch (err) {
                setError(err)
            }
        }

        fetchAll()
        const id = setInterval(fetchAll, interval)

        return () => clearInterval(id)
    }, [queries, interval])

    return { data, error }
}

export const PromQL = {
    sources: 'prometheus_target_scrape_pool_targets{scrape_job!="prometheus"}',
    containers: 'container_last_seen{name=~".+"}'
}