"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams?.get("q") || ""
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>({ services: [], providers: [], bookings: [], users: [] })
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      if (!q || q.trim().length === 0) return setResults({ services: [], providers: [], bookings: [], users: [] })
      setLoading(true)
      try {
        const url = `/api/search?q=${encodeURIComponent(q)}&userId=${user?.id || ""}&userType=${user?.userType || ""}`
        const res = await fetch(url)
        const data = await res.json()
        if (res.ok) setResults(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, user?.id, user?.userType])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Search results for "{q}"</h1>
        <div>
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-medium">Services</h2>
            {results.services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services found</p>
            ) : (
              <div className="space-y-2 mt-3">
                {results.services.map((s: any) => (
                  <Card key={s.id}>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-sm text-muted-foreground">{s.category} • ${s.price}</div>
                        </div>
                        <div>
                          <Button variant="outline" onClick={() => router.push(`/services/${s.id}`)}>View</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">Providers</h2>
            {results.providers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No providers found</p>
            ) : (
              <div className="space-y-2 mt-3">
                {results.providers.map((p: any) => (
                  <Card key={p.id}>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-sm text-muted-foreground">{p.location || p.specialties}</div>
                        </div>
                        <div>
                          <Button variant="outline" onClick={() => router.push(`/provider/${p.id}`)}>View</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium">Bookings</h2>
            {results.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings found</p>
            ) : (
              <div className="space-y-2 mt-3">
                {results.bookings.map((b: any) => (
                  <Card key={b.id}>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{b.service?.name}</div>
                          <div className="text-sm text-muted-foreground">Booking #{b.id} • {b.status}</div>
                        </div>
                        <div>
                          <Button variant="outline" onClick={() => router.push(`/dashboard/bookings?bookingId=${b.id}`)}>Open</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {user?.userType === "admin" && (
            <section>
              <h2 className="text-lg font-medium">Users</h2>
              {results.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {results.users.map((u: any) => (
                    <Card key={u.id}>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-sm text-muted-foreground">{u.email} • {u.userType}</div>
                          </div>
                          <div>
                            <Button variant="outline" onClick={() => router.push(`/profile/${u.id}`)}>Open</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
