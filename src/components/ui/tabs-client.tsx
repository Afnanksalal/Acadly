"use client"
import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function TabsClient({ tabs, defaultTab, children }: { tabs: { id: string; label: string; icon?: string }[]; defaultTab: string; children: (activeTab: string) => ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  return (
    <div className="space-y-6">
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-foreground/60 hover:text-foreground"
              )}
            >
              {tab.icon && <span className="mr-2">{tab.icon}</span>}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div>{children(activeTab)}</div>
    </div>
  )
}
