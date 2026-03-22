import { useEffect, useState } from 'react'
import { Container } from './Container.jsx'

export default function App() {
  const [apiResponse, setApiResponse] = useState([])
  const [query, setQuery] = useState('container_health_state{name=~".+"}')

  useEffect(() => {
    fetch(`/api/v1/query?query=${encodeURIComponent(query)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => undefined)

        if (!res.ok) {
          console.error('fetch failed:', data?.error ?? res.statusText)
        }

        return data
      })
      .then((data) => {
        const results = data?.data?.result ?? []
        setApiResponse(results)
        console.log('Prometheus results:', results)
      })
      .catch((err) => {
        console.error('fetch failed:', err)
        setApiResponse([])
      })
  }, [query])

  return (
    <>
      {apiResponse.map((result) => {
        const metric = result?.metric ?? {}
        const name = metric.name ?? metric.container_label_com_docker_compose_service ?? 'unknown'
        const imageName = metric.image ?? ''

        return <Container key={metric.id ?? name} name={name} imageName={imageName} />
      })}
    </>
  )
}
