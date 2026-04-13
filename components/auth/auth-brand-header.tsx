"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { config } from "@/lib/config"
import { cn } from "@/lib/utils"

const SLOGAN_LINE1 = "Plus qu'une banque,"
const SLOGAN_LINE2_BEFORE = "nous sommes votre "
const SLOGAN_LINE2_HIGHLIGHT = "confident financier"
const SLOGAN_LINE2_END = " !"

const LINE2_FULL = SLOGAN_LINE2_BEFORE + SLOGAN_LINE2_HIGHLIGHT + SLOGAN_LINE2_END
const HL_START = SLOGAN_LINE2_BEFORE.length
const HL_END = HL_START + SLOGAN_LINE2_HIGHLIGHT.length

/** Pause avant de relancer l'animation (ms) */
const LOOP_RESTART_MS = 2600

function charDelay(char: string): number {
  if (char === " ") return 32
  if (char === "," || char === "!" || char === "'") return 140
  return 48
}

function Caret({ visible }: { visible: boolean }) {
  return (
    <span
      className={cn(
        "inline-block w-[2px] h-[0.85em] translate-y-[0.12em] align-middle rounded-[1px] bg-[#f4c430] shadow-[0_0_12px_rgba(244,196,48,0.55)] motion-reduce:opacity-100",
        !visible && "motion-safe:opacity-0"
      )}
      aria-hidden
    />
  )
}

function TypewriterSlogan() {
  const [line1Len, setLine1Len] = useState(0)
  const [line2Len, setLine2Len] = useState(0)
  const [phase, setPhase] = useState<"line1" | "pause" | "line2" | "done">("line1")
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    if (phase === "line1") {
      if (line1Len < SLOGAN_LINE1.length) {
        const ch = SLOGAN_LINE1[line1Len]
        const t = window.setTimeout(() => setLine1Len((n) => n + 1), charDelay(ch))
        return () => clearTimeout(t)
      }
      const t = window.setTimeout(() => setPhase("pause"), 320)
      return () => clearTimeout(t)
    }
    if (phase === "pause") {
      const t = window.setTimeout(() => setPhase("line2"), 380)
      return () => clearTimeout(t)
    }
    if (phase === "line2") {
      if (line2Len < LINE2_FULL.length) {
        const ch = LINE2_FULL[line2Len]
        const t = window.setTimeout(() => setLine2Len((n) => n + 1), charDelay(ch))
        return () => clearTimeout(t)
      }
      const t = window.setTimeout(() => setPhase("done"), 400)
      return () => clearTimeout(t)
    }
    if (phase === "done") {
      const t = window.setTimeout(() => {
        setLine1Len(0)
        setLine2Len(0)
        setPhase("line1")
      }, LOOP_RESTART_MS)
      return () => clearTimeout(t)
    }
    return undefined
  }, [phase, line1Len, line2Len])

  useEffect(() => {
    const id = window.setInterval(() => setCursorVisible((v) => !v), 530)
    return () => clearInterval(id)
  }, [])

  const visible1 = SLOGAN_LINE1.slice(0, line1Len)
  const visible2 = LINE2_FULL.slice(0, line2Len)

  const seg2PlainEnd = Math.min(visible2.length, HL_START)
  const seg2Plain = visible2.slice(0, seg2PlainEnd)
  const seg2HlEnd = Math.min(visible2.length, HL_END)
  const seg2Hl = visible2.slice(seg2PlainEnd, seg2HlEnd)
  const seg2Tail = visible2.slice(seg2HlEnd)

  const cursorLine1 =
    (phase === "line1" && line1Len < SLOGAN_LINE1.length) || phase === "pause"
  const cursorLine2Typing = phase === "line2" && line2Len < LINE2_FULL.length
  const cursorLine2Done = phase === "done"

  const fullSloganA11y = `${SLOGAN_LINE1} ${LINE2_FULL}`

  return (
    <p
      className={cn(
        "max-w-[20rem] text-center font-heading antialiased sm:max-w-[22rem] lg:max-w-[min(24rem,32vw)] lg:text-left xl:max-w-[28rem]",
        "text-[0.62rem] font-medium leading-none tracking-wide text-white sm:text-[0.68rem] md:text-xs lg:text-[0.78rem] xl:text-[0.82rem]",
        "drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]"
      )}
      aria-live="off"
      aria-label={fullSloganA11y}
    >
      <span className="block text-white leading-none">
        {visible1}
        {cursorLine1 && <Caret visible={cursorVisible} />}
      </span>
      <span className="mt-0.5 block leading-none text-white/95 sm:mt-0.5">
        {seg2Plain}
        {seg2Hl.length > 0 && (
          <span className="font-bold not-italic text-[#f4c430] drop-shadow-[0_0_14px_rgba(244,196,48,0.35)]">
            {seg2Hl}
          </span>
        )}
        {seg2Tail}
        {cursorLine2Typing && <Caret visible={cursorVisible} />}
        {cursorLine2Done && <Caret visible={cursorVisible} />}
      </span>
    </p>
  )
}

type AuthBrandHeaderProps = {
  className?: string
}

export function AuthBrandHeader({ className }: AuthBrandHeaderProps) {
  return (
    <header
      className={cn(
        "absolute top-4 sm:top-4 lg:top-[2vw] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-[min(52rem,calc(100vw-2rem))] -translate-x-1/2 lg:left-[2vw] lg:translate-x-0",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4 lg:flex-row lg:items-center lg:gap-0">
        <a
          href={config.BNG_CONNECT_WEBSITE_URL}
          className="inline-flex shrink-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4c430]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2d6e3e]/80"
          aria-label="BNG Connect — aller sur bngconnect.com"
        >
          <Image
            src="/images/logowhite.png"
            alt="BNG Logo"
            width={160}
            height={48}
            className="object-contain drop-shadow-lg w-32 sm:w-36 lg:w-[min(12vw,220px)] lg:min-w-[160px]"
            priority
          />
        </a>

        <div
          className="h-px w-16 shrink-0 bg-gradient-to-r from-transparent via-white/45 to-transparent sm:w-24 lg:mx-5 lg:h-12 lg:w-px lg:bg-gradient-to-b lg:from-transparent lg:via-[#f4c430]/85 lg:to-transparent xl:mx-6 xl:h-14"
          aria-hidden
        />

        <TypewriterSlogan />
      </div>
    </header>
  )
}
