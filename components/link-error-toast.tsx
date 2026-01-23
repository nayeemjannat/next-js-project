"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export default function LinkErrorToast() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      let le = params.get("link_error")
      if (!le) {
        const m = document.cookie.match(/(?:^|; )link_error=([^;]+)/)
        if (m) le = decodeURIComponent(m[1])
      }
      if (le === "email_mismatch") {
        toast.error(
          "Google account email does not match your current account email. Please sign in with the matched Google account or use the email associated with your account."
        )
        if (params.has("link_error")) {
          params.delete("link_error")
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : "")
          window.history.replaceState({}, document.title, newUrl)
        }
        document.cookie = "link_error=; Max-Age=0; path=/;"
      }
    } catch (e) {
      // ignore
    }
  }, [])

  return null
}
