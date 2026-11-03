import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"
import { Icon } from "@meujogo/ui/components/icon"
import { mdiAlert, mdiCheckCircle, mdiCloseOctagon, mdiInformation, mdiLoading } from "@mdi/js"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Icon path={mdiCheckCircle} className="size-5 text-ink" />,
        info: <Icon path={mdiInformation} className="size-5 text-ink" />,
        warning: <Icon path={mdiAlert} className="size-5 text-ink" />,
        error: <Icon path={mdiCloseOctagon} className="size-5 text-ink" />,
        loading: <Icon path={mdiLoading} className="size-5 animate-spin text-ink" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast font-body shadow-none!",
          title: "font-bold text-ink",
          description: "text-fg-2!",
        },
      }}
      {...props}
    />
  )
}

type OpcoesDesfazer = {
  /** Caminho MDI mostrado antes da mensagem. */
  icone?: string
  /** Em milissegundos. */
  duracao?: number
  rotulo?: string
}

/**
 * Snackbar escuro de desfazer: superfície `snackbar`, texto branco e a ação em
 * lavanda. Fecha sozinho depois de `duracao` ou ao tocar na ação.
 */
function toastDesfazer(
  mensagem: string,
  onDesfazer: () => void,
  { icone, duracao = 5000, rotulo = "Desfazer" }: OpcoesDesfazer = {}
) {
  return toast.custom(
    (id) => (
      <div
        role="status"
        className="flex h-12 w-(--width) max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg bg-snackbar pr-2 pl-4 font-body text-white dark:ring-1 dark:ring-white/10"
      >
        {icone ? <Icon path={icone} className="size-5 text-white" /> : null}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{mensagem}</span>
        <button
          type="button"
          className="relative ml-auto inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm font-bold text-lavanda outline-none after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-white/8 focus-visible:ring-3 focus-visible:ring-ring"
          onClick={() => {
            onDesfazer()
            toast.dismiss(id)
          }}
        >
          {rotulo}
        </button>
      </div>
    ),
    { duration: duracao }
  )
}

export { Toaster, toastDesfazer }
export type { OpcoesDesfazer }
