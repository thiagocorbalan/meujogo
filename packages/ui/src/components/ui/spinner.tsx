import { cn } from "cn"
import { Icon } from "@meujogo/ui/components/icon"
import { mdiLoading } from "@mdi/js"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Icon path={mdiLoading} data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
