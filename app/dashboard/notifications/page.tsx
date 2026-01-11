"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Notification {
  id: string
  title: string
  body?: string | null
  isRead: boolean
  userId?: string | null
  link?: string | null
  createdAt: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    const iv = setInterval(fetchNotifications, 30000)
    return () => clearInterval(iv)
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&userType=${user.userType}`)
      const data = await res.json()
      if (res.ok && data.notifications) setNotifications(data.notifications)
    } catch (err) {
      console.error(err)
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (id: string) => {
    try {
      const url = `/api/notifications/${id}`
      console.log("dashboard.markRead url", url)
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data?.ok) {
          // reflect DB state
          await fetchNotifications()
          window.dispatchEvent(new Event("notifications:changed"))
        }
      }
    } catch (err) {
      toast.error("Failed to mark read")
    }
  }

  const markAllRead = async () => {
    try {
      // Use server-side batch endpoint to ensure DB is updated
      const res = await fetch(`/api/notifications/mark-all-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, userType: user?.userType }),
      })
      if (res.ok) {
        await fetchNotifications()
        window.dispatchEvent(new Event("notifications:changed"))
      }
    } catch (err) {
      toast.error("Failed to mark all read")
    }
  }

  const clearByReadState = async (readState: boolean) => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?userId=${user.id}&userType=${user.userType}`)
      const data = await res.json()
      const list: Notification[] = data.notifications || []
      // Only delete notifications owned by this user (do not delete global/userType notifications)
      const toDelete = list
        .filter(n => n.isRead === readState && n.userId && n.userId === user.id)
        .map(n => n.id)
        .filter(Boolean)
      if (toDelete.length === 0) {
        toast.success("No notifications to clear")
        return
      }
      await Promise.all(toDelete.map(id => fetch(`/api/notifications/${id}`, { method: "DELETE" })))
      await fetchNotifications()
      window.dispatchEvent(new Event("notifications:changed"))
      toast.success("Notifications cleared")
    } catch (err) {
      console.error(err)
      toast.error("Failed to clear notifications")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">All your recent alerts and updates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchNotifications}>Refresh</Button>
          <Button onClick={markAllRead}>Mark all read</Button>
          <Button variant="outline" onClick={() => clearByReadState(true)}>Clear read</Button>
          <Button variant="outline" onClick={() => clearByReadState(false)}>Clear unread</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">No notifications</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={`transition-shadow ${n.isRead ? '' : 'ring-2 ring-primary/20'}`}>
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{n.title}</h3>
                    {!n.isRead && <Badge className="text-xs">New</Badge>}
                  </div>
                  {n.body && <p className="text-sm text-muted-foreground mt-2">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!n.isRead && <Button size="sm" onClick={() => markRead(n.id)}>Mark read</Button>}
                  {n.link && <Button size="sm" variant="outline" onClick={() => window.location.href = n.link!}>View</Button>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
