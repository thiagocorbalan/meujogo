import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import { Icon } from "@meujogo/ui/components/icon"

const campoBase =
  "w-full min-w-0 rounded-lg border-0 bg-surface-2 text-base text-foreground transition-shadow duration-150 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:ring-2 aria-invalid:ring-destructive"

function Input({
  className,
  type,
  icone,
  ...props
}: React.ComponentProps<"input"> & {
  /** Caminho MDI do ícone à esquerda, em muted. */
  icone?: string
}) {
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        campoBase,
        "h-input px-4 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        icone && "pl-12",
        className
      )}
      {...props}
    />
  )
  if (!icone) return input
  return (
    <div data-slot="input-group" className="relative w-full">
      <Icon
        path={icone}
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
      />
      {input}
    </div>
  )
}

export { Input, campoBase }
