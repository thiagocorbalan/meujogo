"use client"

import { useState } from "react"
import { Button } from "@meujogo/ui/components/ui/button"
import { RootHeader } from "@meujogo/ui/components/mj/header"
import { BottomNav } from "@meujogo/ui/components/mj/bottom-nav"
import { PlayerAvatar } from "@meujogo/ui/components/mj/player-avatar"
import { ThemeSwitcher } from "@meujogo/ui/components/mj/theme-switcher"

export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-background text-foreground">
      <RootHeader
        brand="primary"
        group="Racha do Bolinha"
        notifications={3}
        avatar={<PlayerAvatar initials="RF" size={32} />}
        onProfile={() => {}}
        title="Fala, Rodrigo"
        meta="Temporada 2026"
      />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        <ThemeSwitcher />
        <Button>Confirmar presença</Button>
      </main>
      <BottomNav active={activeTab} onSelect={setActiveTab} className="sticky bottom-0" />
    </div>
  )
}
