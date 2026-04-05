import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import { trackRouteView } from "../services/analytics"

const RouteAnalyticsTracker = () => {
  const location = useLocation()
  const lastKeyRef = useRef("")

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}${location.hash}`
    if (lastKeyRef.current === routeKey) {
      return
    }

    lastKeyRef.current = routeKey
    trackRouteView(location)
  }, [location])

  return null
}

export default RouteAnalyticsTracker
