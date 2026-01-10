"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  // token comes from the path `[token]`
  const params = useParams()
  const token = params?.token ?? ''
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setMessage("Passwords do not match")
    setLoading(true)
    try {
      // token may be provided in path segment; also try to extract from URL path
      const pathToken = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null
      const usedToken = token || pathToken || ''
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: usedToken, password }),
      })
      const json = await res.json()
      if (json.ok) {
        router.push('/auth/login')
      } else {
        setMessage(json.error || 'Unable to reset password')
      }
    } catch (err) {
      console.error(err)
      setMessage('Server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Set a new password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">New password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm password</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          {message && <div className="text-sm text-red-600">{message}</div>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save password'}</Button>
        </form>
      </div>
    </div>
  )
}
