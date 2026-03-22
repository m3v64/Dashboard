import { useMemo } from 'react'
import { useQueries, PromQL } from './Querie'
import Container from './Container.jsx'
import Source from './Source.jsx'

export default function App() {
  const queries = useMemo(() => ({
      sources: PromQL.sources,
      containers: PromQL.containers
    }), [])
  const { data, error } = useQueries(queries)

  const sources = data.sources ?? []
  const containers = data.containers ?? []

  const containersBySource = useMemo(() => {
    const index = new Map()

    for (const result of containers) {
      const metric = result?.metric ?? {}
      const job = metric.job
      if (!job) continue

      const list = index.get(job)
      if (list) list.push(result)
      else index.set(job, [result])
    }

    return index
  }, [containers])

  return (
    <>
      {
        !error && sources.map((result) => {
          const metric = result?.metric ?? {}
          const sourceName = metric.scrape_job ?? 'not found'
          const matchingContainers = containersBySource.get(metric.scrape_job) ?? []

          return (
            <Source key={metric.id ?? sourceName} name={sourceName}>
              {
                matchingContainers.map((result) => {
                  const metric = result?.metric ?? {}
                  const name = metric.name ?? metric.container_label_com_docker_compose_service ?? 'not found'
                  const imageName = metric.image ?? 'not found'

                  return <Container key={metric.id ?? name} name={name} imageName={imageName} />
                })
              }
            </Source>
          )
        })
      }
    </>
  )
}
