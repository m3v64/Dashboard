import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useContainers } from "../hooks/useContainers"
import { useSystem } from "../hooks/useSystem"

const FAVORITES_KEY = "dashboard_favorites"
const loadFavorites = () => {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [] } catch { return [] }
}

const DashboardContext = createContext(null)

export const REFRESH_OPTIONS = [
  { label: "5s",  value: 5000 },
  { label: "10s", value: 10000 },
  { label: "15s", value: 15000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
  { label: "Off", value: null },
]

export function DashboardProvider({ children }) {
  const [refreshInterval, setRefreshInterval] = useState(30000)
  const [visible, setVisible] = useState(!document.hidden)

  useEffect(() => {
    const handler = () => setVisible(!document.hidden)
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [])

  const interval = refreshInterval && visible ? refreshInterval : null

  const { containers, stats, error: containerError } = useContainers(interval)
  const { hosts, error: systemError } = useSystem(interval)

  const [favorites, setFavorites] = useState(loadFavorites)

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites])

  return (
    <DashboardContext.Provider
      value={{
        containers,
        stats,
        hosts,
        refreshInterval,
        setRefreshInterval,
        favorites,
        toggleFavorite,
        isFavorite,
        error: containerError || systemError,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
