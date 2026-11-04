import { cn } from "@meujogo/ui/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@meujogo/ui/components/ui/avatar"

const SIZES = {
  32: "size-8 text-xs",
  40: "size-10 text-sm",
  56: "size-14 text-lg",
} as const

type PlayerAvatarProps = {
  initials: string
  photo?: string
  /** Texto alternativo da foto; sem ele o avatar é decorativo, porque o nome já está ao lado. */
  alt?: string
  size?: keyof typeof SIZES
  /** `purple` são iniciais sobre roxo; `light` é o círculo neutro que faz as vezes de foto. */
  tone?: "purple" | "light"
  className?: string
}

function PlayerAvatar({ initials, photo, alt, size = 40, tone = "purple", className }: PlayerAvatarProps) {
  return (
    <Avatar
      aria-hidden={alt ? undefined : true}
      className={cn("after:hidden", SIZES[size], className)}
    >
      {photo ? <AvatarImage src={photo} alt={alt ?? ""} /> : null}
      <AvatarFallback
        className={cn(
          "font-display font-semibold",
          SIZES[size],
          tone === "purple" ? "bg-purple text-white" : "bg-line text-ink"
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}

export { PlayerAvatar }
export type { PlayerAvatarProps }
