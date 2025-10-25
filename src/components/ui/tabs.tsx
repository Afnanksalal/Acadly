"use client"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Tabs({ tabs, initial, onChange, className }: { tabs: { id: string; label: string }[]; initial?: string; onChange?: (id: string) => void; className?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id)
  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-2 border-b border-border">
        {tabs.map(t => (
          <button
            key={t.id}
            className={cn("px-3 py-2 text-sm rounded-t-md", active === t.id ? "bg-muted/60 border border-border border-b-transparent" : "opacity-80 hover:opacity-100")}
            onClick={() => { setActive(t.id); onChange?.(t.id) }}
          >{t.label}</button>
        ))}
      </div>
      <div data-active-tab={active} />
    </div>
  )
}
