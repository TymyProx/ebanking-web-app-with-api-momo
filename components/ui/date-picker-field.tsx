"use client"

import * as React from "react"
import { format, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import type { Matcher } from "react-day-picker"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function parseLocalYmd(s: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim())
  if (!m) return undefined
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const date = new Date(y, mo, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== mo ||
    date.getDate() !== d
  ) {
    return undefined
  }
  return date
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${mo}-${day}`
}

/** Date du jour en AAAA-MM-JJ (fuseau local), pour minDate / maxDate. */
export function toLocalYmd(date: Date = new Date()): string {
  return formatLocalYmd(date)
}

export interface DatePickerFieldProps {
  id?: string
  name?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  buttonClassName?: string
  fromYear?: number
  toYear?: number
  reverseYears?: boolean
  /** Borne minimale inclusive (AAAA-MM-JJ), fuseau local */
  minDate?: string
  /** Borne maximale inclusive (AAAA-MM-JJ), fuseau local */
  maxDate?: string
  disabledDates?: Matcher | Matcher[]
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  closeOnSelect?: boolean
  onTriggerBlur?: () => void
  /** Si `name` est défini, applique l’attribut HTML `required` sur l’input caché */
  required?: boolean
}

export function DatePickerField({
  id,
  name,
  value,
  onChange,
  placeholder = "Sélectionner une date",
  disabled,
  className,
  buttonClassName,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  reverseYears,
  minDate,
  maxDate,
  disabledDates,
  captionLayout = "dropdown",
  closeOnSelect = true,
  onTriggerBlur,
  required: requiredProp,
}: DatePickerFieldProps) {
  const selected = value ? parseLocalYmd(value) : undefined

  const rangeDisabled = React.useMemo(() => {
    if (!minDate && !maxDate) return undefined
    return (date: Date) => {
      const d = startOfDay(date)
      if (minDate) {
        const min = parseLocalYmd(minDate)
        if (min && d < startOfDay(min)) return true
      }
      if (maxDate) {
        const max = parseLocalYmd(maxDate)
        if (max && d > startOfDay(max)) return true
      }
      return false
    }
  }, [minDate, maxDate])

  const disabledCombined = React.useMemo((): Matcher | Matcher[] | undefined => {
    const extra = disabledDates
      ? Array.isArray(disabledDates)
        ? disabledDates
        : [disabledDates]
      : []
    if (rangeDisabled && extra.length > 0) {
      return [rangeDisabled, ...extra]
    }
    if (rangeDisabled) return rangeDisabled
    if (extra.length > 0) return extra.length === 1 ? extra[0]! : extra
    return undefined
  }, [rangeDisabled, disabledDates])

  const [open, setOpen] = React.useState(false)

  const startMonth = React.useMemo(
    () => new Date(fromYear, 0, 1),
    [fromYear]
  )
  const endMonth = React.useMemo(
    () => new Date(toYear, 11, 1),
    [toYear]
  )

  return (
    <div className={cn("relative w-full", className)}>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value || ""}
          readOnly
          required={requiredProp}
        />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            onBlur={onTriggerBlur}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              buttonClassName
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
            {selected ? (
              format(selected, "dd/MM/yyyy", { locale: fr })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout={captionLayout}
            locale={fr}
            reverseYears={reverseYears}
            startMonth={startMonth}
            endMonth={endMonth}
            fromYear={fromYear}
            toYear={toYear}
            selected={selected}
            defaultMonth={selected ?? new Date()}
            disabled={disabledCombined}
            formatters={{
              formatMonthDropdown: (date) =>
                format(date, "LLL", { locale: fr }),
            }}
            onSelect={(d) => {
              if (d) {
                onChange(formatLocalYmd(d))
              } else {
                onChange("")
              }
              if (closeOnSelect) setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
