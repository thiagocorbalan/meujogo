"use client"

import { useState } from "react"
import { Button } from "@meujogo/ui/components/ui/button"
import { HeaderRaiz } from "@meujogo/ui/components/mj/header"
import { NavInferior } from "@meujogo/ui/components/mj/nav-inferior"
import { AvatarJogador } from "@meujogo/ui/components/mj/avatar-jogador"
import { SeletorDeTema } from "@meujogo/ui/components/mj/seletor-de-tema"

export function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState("inicio")

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-background text-foreground">
      <HeaderRaiz
        marca="principal"
        grupo="Racha do Bolinha"
        notificacoes={3}
        avatar={<AvatarJogador iniciais="RF" tamanho={32} />}
        onPerfil={() => {}}
        titulo="Fala, Rodrigo"
        meta="Temporada 2026"
      />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        <SeletorDeTema />
        <Button>Confirmar presença</Button>
      </main>
      <NavInferior ativo={activeTab} onSelecionar={setActiveTab} className="sticky bottom-0" />
    </div>
  )
}
