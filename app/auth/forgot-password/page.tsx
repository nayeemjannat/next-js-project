"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'request'|'enter-otp'|'set-password'>('request')
  const [otp, setOtp] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  // OTP inputs refs

  useEffect(() => {
    if (step === 'enter-otp') {
      setTimeout(() => otpInputsRef.current[0]?.focus(), 50)
    }
  }, [step])

  // OTP input refs
  const otpInputsRef = useRef<HTMLInputElement[]>([])
  const setOtpInputRef = (el: HTMLInputElement | null, idx: number) => {
    if (!el) return
    otpInputsRef.current[idx] = el
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        // proceed to verification step where user enters OTP + new password
        setStep('enter-otp')
        setIsSubmitted(true)
      } else {
        setMessage('Unable to send code. Try again later.')
      }
    } catch (err) {
      console.error('forgot-password submit error', err)
      setMessage('Unable to send code. Try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (password !== confirmPassword) return setMessage('Passwords do not match')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      })
      const json = await res.json()
      if (json.ok) {
        setMessage('Password reset successful. Redirecting to login...')
        setTimeout(() => (window.location.href = '/auth/login'), 1200)
      } else {
        setMessage(json.error || 'Invalid code or expired')
      }
    } catch (err) {
      console.error('verify error', err)
      setMessage('Server error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              H
            </div>
            <span className="text-2xl font-bold">Homease</span>
          </div>
        </div>

        <Card>
              <CardHeader>
                <CardTitle>Reset Your Password</CardTitle>
                <CardDescription>
                  {step === 'request' && (
                    <>{isSubmitted ? "Check your email for a 6-digit code" : "Enter your email address and we'll send you a 6-digit code"}</>
                  )}
                  {step === 'enter-otp' && <>Enter the 6-digit code we sent to <strong>{email}</strong>.</>}
                  {step === 'set-password' && <>Code verified — pick a new password for your account.</>}
                </CardDescription>
              </CardHeader>
          <CardContent>
              {step === 'request' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Code"}
                </Button>

                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 text-sm text-primary hover:underline justify-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </form>
            ) : (
              <>
                    {step === 'enter-otp' && (
                      <form onSubmit={async (e) => { e.preventDefault(); /* handle OTP submit below */ }} className="space-y-6 text-center">
                        <div>
                          <label className="block text-sm font-medium mb-2">Enter the 6-digit code</label>
                          <div className="flex gap-2 justify-center">
                            {otpDigits.map((d, i) => (
                              <input
                                key={i}
                                ref={(el) => setOtpInputRef(el, i)}
                                value={d}
                                onChange={(e) => {
                                  const v = e.target.value.replace(/[^0-9]/g, '').slice(-1)
                                  const next = [...otpDigits]
                                  next[i] = v
                                  setOtpDigits(next)
                                  if (v && otpInputsRef.current[i + 1]) otpInputsRef.current[i + 1].focus()
                                  if (!v && otpInputsRef.current[i - 1]) otpInputsRef.current[i - 1].focus()
                                  setOtp(next.join(''))
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Backspace' && !otpDigits[i] && otpInputsRef.current[i - 1]) {
                                    otpInputsRef.current[i - 1].focus()
                                  }
                                }}
                                onPaste={(e) => {
                                  const paste = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0,6)
                                  if (paste) {
                                    const next = paste.split('').concat(new Array(6 - paste.length).fill('')).slice(0,6)
                                    setOtpDigits(next)
                                    setOtp(next.join(''))
                                    setTimeout(() => {
                                      const idx = Math.min(paste.length, 5)
                                      otpInputsRef.current[idx]?.focus()
                                    }, 20)
                                  }
                                  e.preventDefault()
                                }}
                                className="w-14 h-14 text-center rounded-xl border-2 border-transparent bg-white shadow hover:shadow-md focus:border-primary focus:shadow-lg transition-transform transform-gpu focus:-translate-y-0.5 text-xl font-semibold"
                              />
                            ))}
                          </div>
                        </div>
                        {message && <div className="text-sm text-red-600">{message}</div>}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            onClick={async () => {
                              // submit OTP for verification
                              const code = otpDigits.join('')
                              if (code.length !== 6) return setMessage('Enter the 6-digit code')
                              setIsLoading(true)
                              try {
                                const res = await fetch('/api/auth/verify-otp', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ email, otp: code }),
                                })
                                const json = await res.json()
                                if (json.ok) {
                                  setStep('set-password')
                                } else {
                                  setMessage(json.error || 'Invalid or expired code')
                                }
                              } catch (err) {
                                console.error('verify-otp error', err)
                                setMessage('Server error')
                              } finally { setIsLoading(false) }
                            }}
                            disabled={isLoading}
                          >Verify Code</Button>
                          <Button variant="secondary" className="flex-1" onClick={() => { setStep('request'); setOtpDigits(['','','','','','']); setOtp(''); }}>Resend</Button>
                        </div>
                      </form>
                    )}

                    {step === 'set-password' && (
                      <form onSubmit={handleVerify} className="space-y-6 text-center">
                        <div>
                          <label className="block text-sm font-medium mb-2">New password</label>
                          <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Confirm password</label>
                          <Input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                        {message && <div className="text-sm text-red-600">{message}</div>}
                        <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save password'}</Button>
                        <Link href="/auth/login" className="flex items-center gap-2 text-sm text-primary hover:underline justify-center">
                          <ArrowLeft className="w-4 h-4" />
                          Back to Login
                        </Link>
                      </form>
                    )}
                  </>
                )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
