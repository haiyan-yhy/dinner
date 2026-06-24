"use client"

import { useEffect, useRef } from "react"

export function getOrCreateVisitorId(): string {
  const key = "tdw_visitor_id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem(key, id)
  }
  return id
}

export function useTracker(pageName: string) {
  const visitorIdRef = useRef<string>("")
  const enterTimeRef = useRef<string>(new Date().toISOString())

  useEffect(() => {
    const visitorId = getOrCreateVisitorId()
    visitorIdRef.current = visitorId
    const enterTime = enterTimeRef.current

    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    }).catch(() => {})

    fetch("/api/track/visitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId }),
    }).catch(() => {})

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      const duration = Math.floor((Date.now() - new Date(enterTime).getTime()) / 1000)
      fetch("/api/track/duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, pageName, enterTime, durationSeconds: duration }),
      }).catch(() => {})
    }, 30000)

    const handleLeave = () => {
      const leaveTime = new Date().toISOString()
      const duration = Math.floor((Date.now() - new Date(enterTime).getTime()) / 1000)
      navigator.sendBeacon(
        "/api/track/duration",
        JSON.stringify({ visitorId, pageName, enterTime, leaveTime, durationSeconds: duration })
      )
    }

    window.addEventListener("beforeunload", handleLeave)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleLeave()
    })

    return () => {
      clearInterval(heartbeat)
      window.removeEventListener("beforeunload", handleLeave)
    }
  }, [pageName])

  const getVisitorId = () => visitorIdRef.current

  return { getVisitorId }
}
