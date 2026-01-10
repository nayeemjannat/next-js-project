"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { useAuth } from "@/components/auth-context"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

interface Notif {
  id: string
  title: string
  body?: string | null
  isRead: boolean
  link?: string | null
  createdAt: string
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const router = useRouter()
  const [items, setItems] = useState<Notif[]>([])

  useEffect(() => {
    if (!user) return
    fetchData()
    const iv = setInterval(fetchData, 30000)
    const onUpdate = () => fetchData()
    window.addEventListener("notifications:changed", onUpdate)
    return () => {
      clearInterval(iv)
      window.removeEventListener("notifications:changed", onUpdate)
    }
  }, [user])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${user?.id}&userType=${user?.userType}&limit=6`)
      const data = await res.json()
      if (res.ok) {
        setItems(data.notifications || [])
        setUnread(data.unreadCount || 0)
      }
    } catch (err) {
      // silent
    }
  }

  const markRead = async (id: string, link?: string | null) => {
    try {
      console.log("markRead: PUT", id)
      const url = `/api/notifications/${id}`
      console.log("markRead: url", url)
      if (!id) {
        console.warn("markRead called with undefined id")
        return
      }
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      if (!res.ok) {
        console.warn("markRead: PUT failed, refetching list")
        await fetchData()
        return
      }

      // Confirm DB update by fetching the notification back from server
      try {
        const check = await fetch(`/api/notifications/${id}`)
        if (check.ok) {
          const data = await check.json()
          const confirmed = data?.notification?.isRead
          console.log("markRead: confirmed isRead=", confirmed)
          if (confirmed) {
            setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
            setUnread((u) => Math.max(0, u - 1))
            window.dispatchEvent(new Event("notifications:changed"))
            if (link) {
              console.log("markRead: navigating to", link)
              await router.push(link)
            }
            return
          }
        }
      } catch (e) {
        console.warn("markRead: confirmation check failed", e)
      }

      // Fallback: update UI and dispatch even if confirmation failed
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnread((u) => Math.max(0, u - 1))
      window.dispatchEvent(new Event("notifications:changed"))
      if (link) window.location.href = link
    } catch (err) {
      // ignore
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-1 z-50" type="button">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full bg-red-600 text-white">{unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 pointer-events-auto z-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">Notifications</h4>
          <button className="text-sm text-muted-foreground" onClick={fetchData}>Refresh</button>
        </div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {items.length === 0 && <p className="text-sm text-muted-foreground">No notifications</p>}
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                console.log("notif clicked", n.id, "link=", n.link, "isRead=", n.isRead)
                if (n.isRead) {
                  if (n.link) router.push(n.link)
                } else {
                  markRead(n.id, n.link)
                }
              }}
              className={`w-full text-left p-2 rounded-md hover:bg-muted/50 cursor-pointer ${n.isRead ? '' : 'bg-primary/5'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {n.body && <div className="text-sm text-muted-foreground mt-1">{n.body}</div>}
                </div>
                <div className="flex-shrink-0 ml-2">
                  {!n.isRead && (
                    <span className="text-sm text-primary">Open</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
