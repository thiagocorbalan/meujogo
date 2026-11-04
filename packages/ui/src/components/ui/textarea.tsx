import * as React from "react"
import { cn } from "cn"
import { fieldBase } from "@meujogo/ui/components/ui/input"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "flex field-sizing-content min-h-24 px-4 py-3.5", className)}
      {...props}
    />
  )
}

export { Textarea }
