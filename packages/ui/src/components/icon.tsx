import * as React from "react"
import { cn } from "cn"

type IconProps = Omit<React.ComponentProps<"svg">, "children"> & {
  path: string
  title?: string
}

function Icon({ path, title, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={cn("shrink-0", className)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path d={path} />
    </svg>
  )
}

export { Icon }
export type { IconProps }
