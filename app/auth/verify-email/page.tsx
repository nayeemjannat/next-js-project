"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-context"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams?.get("token") || ''
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const [emailInput, setEmailInput] = useState(user?.email ?? "")
  const [otpInput, setOtpInput] = useState("")

  useEffect(() => {
    if (!token) return
    ;(async () => {
      setStatus('loading')
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const json = await res.json()
        if (json.ok) {
          setStatus('success')
          setMessage('Email verified successfully.')
        } else {
          setStatus('error')
          setMessage(json.error || 'Verification failed')
        }
      } catch (err) {
        console.error(err)
        setStatus('error')
        setMessage('Server error')
      }
    })()
  }, [token])

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, otp: otpInput }),
      })
      const json = await res.json()
      if (json.ok) {
        setStatus('success')
        setMessage('Email verified successfully.')
      } else {
        setStatus('error')
        setMessage(json.error || 'Verification failed')
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setMessage('Server error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && <p>Verifying...</p>}
        {status === 'success' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Verified</h2>
            <p className="mb-4">{message}</p>
            <Button onClick={() => {
              try {
                const stored = localStorage.getItem('homease_user')
                if (stored) {
                  const u = JSON.parse(stored)
                  u.emailVerified = true
                  localStorage.setItem('homease_user', JSON.stringify(u))
                }
              } catch (e) {}
              router.push('/dashboard')
            }}>Go to dashboard</Button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Verification failed</h2>
            <p className="mb-4">{message}</p>
            <Button onClick={() => router.push('/auth/login')}>Back to login</Button>
          </div>
        )}

        {/* Manual OTP form when no token or user prefers to enter code */}
        {!token && (
          <form onSubmit={handleManualVerify} className="space-y-4 mt-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Verification code</label>
              <Input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Verify</Button>
          </form>
        )}
      </div>
    </div>
  )
}
