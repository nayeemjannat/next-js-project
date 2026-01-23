"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
  className?: string
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className,
}: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null)

  // Initialize refs array
  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Handle input change
  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, "")
    if (digit.length > 1) return

    // Update value
    const newOtp = value.split("")
    newOtp[index] = digit
    const updatedOtp = newOtp.join("").slice(0, length)
    onChange(updatedOtp)

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }

    // Call onComplete when all digits are filled
    if (updatedOtp.length === length && onComplete) {
      onComplete(updatedOtp)
    }
  }

  // Handle key down
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        // If current is empty, focus previous
        inputRefs.current[index - 1]?.focus()
        setFocusedIndex(index - 1)
      } else {
        // Clear current and focus previous
        const newOtp = value.split("")
        newOtp[index] = ""
        onChange(newOtp.join(""))
        if (index > 0) {
          inputRefs.current[index - 1]?.focus()
          setFocusedIndex(index - 1)
        }
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
      setFocusedIndex(index - 1)
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      setFocusedIndex(index + 1)
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length)
    if (pastedData) {
      onChange(pastedData)
      // Focus the last filled input or the last input
      const focusIndex = Math.min(pastedData.length - 1, length - 1)
      inputRefs.current[focusIndex]?.focus()
      setFocusedIndex(focusIndex)
    }
  }

  // Handle focus
  const handleFocus = (index: number) => {
    setFocusedIndex(index)
    // Select all text when focused
    inputRefs.current[index]?.select()
  }

  // Handle blur
  const handleBlur = () => {
    setFocusedIndex(null)
  }

  return (
    <div className={cn("flex items-center gap-2 justify-center", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold rounded-lg border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            error
              ? "border-destructive focus:border-destructive focus:ring-destructive"
              : "border-input focus:border-primary focus:ring-primary",
            focusedIndex === index && "scale-105 shadow-md",
            value[index] && !error && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}


