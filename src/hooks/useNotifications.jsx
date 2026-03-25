import { useState, useEffect, useRef, useCallback } from "react"

const NOTIF_KEY = "dashboard_notifications_enabled"

export function useNotifications(containers, hosts) {
  const [enabled, setEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY)) ?? false } catch { return false }
  })
  const prevContainers = useRef(new Map())
  const prevHosts = useRef(new Map())
  const initialLoad = useRef(true)

  const send = useCallback((title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" })
    }
  }, [])

  const toggle = useCallback(async () => {
    if (!enabled) {
      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission()
        if (perm !== "granted") return
      } else if (Notification.permission === "denied") {
        return
      }
      localStorage.setItem(NOTIF_KEY, "true")
      setEnabled(true)
    } else {
      localStorage.setItem(NOTIF_KEY, "false")
      setEnabled(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || containers.length === 0) return

    if (initialLoad.current) {
      initialLoad.current = false
      const map = new Map()
      for (const c of containers) map.set(c.id, c)
      prevContainers.current = map
      return
    }

    const prev = prevContainers.current

    for (const c of containers) {
      const old = prev.get(c.id)
      if (!old) {
        send("New Container", `${c.name} appeared (${c.status})`)
        continue
      }

      if (old.status !== "unhealthy" && c.status === "unhealthy") {
        send("Container Unhealthy", `${c.name} — CPU ${c.cpuPercent}% / MEM ${c.memoryPercent}%`)
      }

      if (old.status !== "stopped" && c.status === "stopped") {
        send("Container Stopped", `${c.name} is no longer running`)
      }

      if (old.status !== "running" && c.status === "running" && (old.status === "unhealthy" || old.status === "stopped")) {
        send("Container Recovered", `${c.name} is running again`)
      }

      if (old.cpuPercent <= 90 && c.cpuPercent > 90) {
        send("High CPU", `${c.name} at ${c.cpuPercent}% CPU`)
      }

      if (old.memoryPercent <= 90 && c.memoryPercent > 90) {
        send("High Memory", `${c.name} at ${c.memoryPercent}% memory`)
      }
    }

    for (const [id, old] of prev) {
      if (!containers.find((c) => c.id === id)) {
        send("Container Removed", `${old.name} is no longer reported`)
      }
    }

    const map = new Map()
    for (const c of containers) map.set(c.id, c)
    prevContainers.current = map
  }, [containers, enabled, send])

  useEffect(() => {
    if (!enabled || !hosts || hosts.length === 0) return

    const prev = prevHosts.current

    for (const h of hosts) {
      const old = prev.get(h.id)
      if (!old) { prev.set(h.id, h); continue }

      if (old.cpuUsage <= 90 && h.cpuUsage > 90) {
        send("Host High CPU", `${h.name} at ${h.cpuUsage}% CPU`)
      }
      if (old.memPercent <= 90 && h.memPercent > 90) {
        send("Host High Memory", `${h.name} at ${h.memPercent}% memory`)
      }
    }

    const map = new Map()
    for (const h of hosts) map.set(h.id, h)
    prevHosts.current = map
  }, [hosts, enabled, send])

  return { enabled, toggle }
}
