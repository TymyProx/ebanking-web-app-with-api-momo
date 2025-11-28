"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  onComplete?: (value: string) => void
  autoFocus?: boolean
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  className,
  onComplete,
  autoFocus = false,
}: OtpInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  React.useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Auto focus first input on mount
  React.useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  // Track if onComplete has been called for this value
  const completedValueRef = React.useRef<string>("")

  // Check if OTP is complete
  React.useEffect(() => {
    if (value.length === length && onComplete && value !== completedValueRef.current) {
      completedValueRef.current = value
      onComplete(value)
    }
  }, [value, length, onComplete])

  // Reset completed value when value is cleared
  React.useEffect(() => {
    if (value.length === 0) {
      completedValueRef.current = ""
    }
  }, [value])

  const handleChange = (index: number, digit: string) => {
    if (disabled) return

    // Only allow digits
    if (digit && !/^\d+$/.test(digit)) return

    const newValue = value.split("")
    newValue[index] = digit
    const newOtp = newValue.join("")

    onChange(newOtp)

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    // Handle backspace
    if (e.key === "Backspace") {
      e.preventDefault()
      const newValue = value.split("")
      
      if (newValue[index]) {
        // Clear current digit
        newValue[index] = ""
        onChange(newValue.join(""))
      } else if (index > 0) {
        // Move to previous and clear
        newValue[index - 1] = ""
        onChange(newValue.join(""))
        inputRefs.current[index - 1]?.focus()
      }
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    if (disabled) return

    const pastedData = e.clipboardData.getData("text/plain").slice(0, length)
    
    // Only accept if all characters are digits
    if (!/^\d+$/.test(pastedData)) return

    onChange(pastedData)

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleFocus = (index: number) => {
    // Select the content when focused
    inputRefs.current[index]?.select()
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-semibold",
            "border-2 rounded-lg",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary",
            "transition-all duration-200",
            value[index] ? "border-primary" : "border-gray-300",
            disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-text bg-white hover:border-primary",
          )}
        />
      ))}
    </div>
  )
}
