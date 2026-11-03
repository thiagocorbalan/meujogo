import { cn } from "@meujogo/ui/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@meujogo/ui/components/ui/avatar"

const TAMANHOS = {
  32: "size-8 text-xs",
  40: "size-10 text-sm",
  56: "size-14 text-lg",
} as const

type AvatarJogadorProps = {
  iniciais: string
  foto?: string
  /** Texto alternativo da foto; sem ele o avatar é decorativo, porque o nome já está ao lado. */
  alt?: string
  tamanho?: keyof typeof TAMANHOS
  /** `roxo` são iniciais sobre roxo; `claro` é o círculo neutro que faz as vezes de foto. */
  tom?: "roxo" | "claro"
  className?: string
}

function AvatarJogador({ iniciais, foto, alt, tamanho = 40, tom = "roxo", className }: AvatarJogadorProps) {
  return (
    <Avatar
      aria-hidden={alt ? undefined : true}
      className={cn("after:hidden", TAMANHOS[tamanho], className)}
    >
      {foto ? <AvatarImage src={foto} alt={alt ?? ""} /> : null}
      <AvatarFallback
        className={cn(
          "font-display font-semibold",
          TAMANHOS[tamanho],
          tom === "roxo" ? "bg-roxo text-white" : "bg-line text-ink"
        )}
      >
        {iniciais}
      </AvatarFallback>
    </Avatar>
  )
}

export { AvatarJogador }
export type { AvatarJogadorProps }
