"use client"

import { useEffect, useState } from "react"
import { LayoutGrid } from "lucide-react"
import { getPortalAuthFeatureSlides } from "@/lib/portal-auth-feature-slides"
import { cn } from "@/lib/utils"

const slides = getPortalAuthFeatureSlides()
const ROTATE_MS = 3500

function sentenceCaseLabel(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Carte « Fonctionnalités » (login / auth) : carrousel horizontal (menu sidebar).
 */
export function AuthFeaturesInfoCard({ className }: { className?: string }) {
  const [index, setIndex] = useState(0)
  const n = slides.length

  useEffect(() => {
    if (n <= 1) return
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % n)
    }, ROTATE_MS)
    return () => window.clearInterval(t)
  }, [n])

  const currentLabel = slides[index] ? sentenceCaseLabel(slides[index].title) : ""

  return (
    <div className={cn("group relative", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-white/75 backdrop-blur-xl rounded-xl shadow-lg px-4 py-3.5 sm:p-4 lg:p-[1.2vw] hover:shadow-xl hover:-translate-y-1 hover:bg-white/85 transition-all duration-300 border border-white/40 overflow-hidden">
        <div className="absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-[#f4c430]/10 to-transparent rounded-bl-full" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative flex-shrink-0">
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-[#f4c430]/10 to-[#f4c430]/5 rounded-xl">
              <LayoutGrid className="h-4 sm:h-5 w-4 sm:w-5 text-[#f4c430]" aria-hidden />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-[clamp(0.75rem,0.9vw,1rem)] drop-shadow-sm uppercase tracking-wide">
              Fonctionnalités
            </h3>
            {n > 0 ? (
              <>
                <div className="mt-0.5 min-h-[1.35em] overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-out motion-reduce:transition-none will-change-transform"
                    style={{
                      width: `${n * 100}%`,
                      transform: `translateX(-${(index * 100) / n}%)`,
                    }}
                  >
                    {slides.map((s, i) => (
                      <p
                        key={`${s.title}-${i}`}
                        className="flex-shrink-0 truncate text-xs lg:text-[clamp(0.65rem,0.75vw,0.9rem)] text-gray-700 font-medium drop-shadow-sm"
                        style={{ width: `${100 / n}%` }}
                        title={sentenceCaseLabel(s.title)}
                        aria-hidden={i !== index}
                      >
                        {sentenceCaseLabel(s.title)}
                      </p>
                    ))}
                  </div>
                </div>
                <span className="sr-only" aria-live="polite" aria-atomic="true">
                  {currentLabel}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
