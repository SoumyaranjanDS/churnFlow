import { trackAnalyticsEvent } from "./churnApi"

const ANALYTICS_SESSION_KEY = "churnflow.analytics.session"
const ANALYTICS_LAST_ROUTE_KEY = "churnflow.analytics.last-route"

const createSessionId = () => {
  if (typeof window === "undefined") {
    return `server-${Date.now()}`
  }

  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const getAnalyticsSessionId = () => {
  if (typeof window === "undefined") {
    return createSessionId()
  }

  const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY)
  if (existing) {
    return existing
  }

  const next = createSessionId()
  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, next)
  return next
}

const getPathGroup = (pathname, search = "") => {
  if (pathname.startsWith("/app")) {
    return "workspace"
  }

  if (pathname === "/login" || pathname === "/signup" || pathname === "/verify-email" || pathname === "/forgot-password" || pathname === "/reset-password" || search.includes("auth=")) {
    return "auth"
  }

  return "public"
}

const sendAnalyticsEvent = async ({ eventName, route = "", pathGroup, context = {} }) => {
  try {
    await trackAnalyticsEvent({
      eventName,
      route,
      pathGroup,
      sessionId: getAnalyticsSessionId(),
      context
    })
  } catch {
    // Analytics must never block product UX.
  }
}

const trackRouteView = async (location) => {
  if (typeof window === "undefined" || !location) {
    return
  }

  const route = `${location.pathname}${location.search || ""}${location.hash || ""}`
  const previousRoute = window.sessionStorage.getItem(ANALYTICS_LAST_ROUTE_KEY)

  if (previousRoute === route) {
    return
  }

  window.sessionStorage.setItem(ANALYTICS_LAST_ROUTE_KEY, route)

  await sendAnalyticsEvent({
    eventName: "route_view",
    route,
    pathGroup: getPathGroup(location.pathname, location.search || ""),
    context: {
      pathname: location.pathname,
      search: location.search || "",
      hash: location.hash || ""
    }
  })
}

const trackProductEvent = async (eventName, context = {}, options = {}) => {
  await sendAnalyticsEvent({
    eventName,
    route: options.route || "",
    pathGroup: options.pathGroup || "workspace",
    context
  })
}

export { getAnalyticsSessionId, trackProductEvent, trackRouteView }
