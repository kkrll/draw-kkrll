import posthog from "posthog-js";

let initialized = false

export function initPostHog() {
  if (initialized) return

  if (import.meta.env.DEV) {
    console.log("[Posthog] Disabled in developement")
    return
  }

  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST

  if (!key) {
    console.warn("[Posthog] Key not found. Analytics disabled")
    return
  }

  try {
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: false,
      disable_session_recording: true
    })
    initialized = true
  } catch (error) {
    console.error("[Posthog] Failed to initialize", error)
  }
}

export function track(eventName: string, properties?: Record<string, unknown>) {
  if (!initialized) return
  posthog.capture(eventName, properties)
}
