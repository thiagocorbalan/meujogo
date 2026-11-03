import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Status chips stay neutral: the vivid color lives only in the 8 px dot, and the
// state is always written, so two states never differ by color alone.
const dot = "before:size-2 before:shrink-0 before:rounded-full before:content-['']"

const badgeVariants = cva(
  "group/badge inline-flex h-chip w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 font-body text-xs font-semibold whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-ring has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&>svg]:pointer-events-none [&>svg]:size-3.5!",
  {
    variants: {
      variant: {
        default: "bg-surface-2 text-fg-2",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-line text-fg-2",
        ghost: "text-fg-2 hover:bg-surface-2",
        accent: "bg-secondary text-secondary-foreground",
        success: cn("bg-surface-2 text-fg-2", dot, "before:bg-success"),
        warning: "bg-surface-2 text-fg-2",
        destructive: cn("bg-surface-2 text-fg-2", dot, "before:bg-error"),
        info: "bg-surface-2 text-fg-2",
        live: cn(
          "bg-live font-bold text-white",
          dot,
          "before:size-1.5 before:animate-pulse before:bg-white"
        ),
        count:
          "min-w-6 bg-primary px-1.5 font-num text-sm font-bold text-primary-foreground",
        bronze: cn("bg-surface-2 text-fg-2", dot, "before:bg-tier-bronze"),
        prata: cn(
          "bg-surface-2 text-fg-2",
          dot,
          "before:bg-tier-prata before:ring-1 before:ring-line"
        ),
        ouro: cn("bg-surface-2 text-fg-2", dot, "before:bg-tier-ouro"),
        diamante: cn("bg-surface-2 text-fg-2", dot, "before:bg-tier-diamante"),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
