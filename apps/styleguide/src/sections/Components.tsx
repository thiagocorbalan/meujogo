import { toast } from "sonner"
import { toastUndo } from "@meujogo/ui/components/ui/sonner"
import { Section, Block, Demo, Row, Logo, Code } from "./_shared"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"
import { Button } from "@meujogo/ui/components/ui/button"
import { Badge } from "@meujogo/ui/components/ui/badge"
import { Input } from "@meujogo/ui/components/ui/input"
import { Textarea } from "@meujogo/ui/components/ui/textarea"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@meujogo/ui/components/ui/field"
import { Checkbox } from "@meujogo/ui/components/ui/checkbox"
import { Switch } from "@meujogo/ui/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@meujogo/ui/components/ui/select"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@meujogo/ui/components/ui/input-otp"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@meujogo/ui/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@meujogo/ui/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@meujogo/ui/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@meujogo/ui/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "@meujogo/ui/components/ui/alert-dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@meujogo/ui/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@meujogo/ui/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@meujogo/ui/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@meujogo/ui/components/ui/toggle-group"
import { Alert, AlertDescription, AlertTitle } from "@meujogo/ui/components/ui/alert"
import { Progress, ProgressLabel, ProgressValue } from "@meujogo/ui/components/ui/progress"
import { Skeleton } from "@meujogo/ui/components/ui/skeleton"
import { Spinner } from "@meujogo/ui/components/ui/spinner"
import { Kbd, KbdGroup } from "@meujogo/ui/components/ui/kbd"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@meujogo/ui/components/ui/avatar"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@meujogo/ui/components/ui/empty"
import symbolLogo from "@meujogo/brand/logo/meujogo-simbolo.svg?raw"
import smallLogo from "@meujogo/brand/logo/meujogo-simbolo-pequeno.svg?raw"

const TEAM_COUNTS = [
  { value: "2", label: "2 times" },
  { value: "3", label: "3 times" },
  { value: "4", label: "4 times" },
]

const RANKING: [number, string, string, number, number, number, boolean][] = [
  [1, "Lucas Andrade", "LA", 12, 31, 1312, false],
  [2, "Rafael Sousa", "RS", 12, 28, 1276, false],
  [3, "Thiago Corbalan", "TC", 11, 24, 1240, true],
  [4, "Diego Martins", "DM", 12, 19, 1188, false],
  [5, "Caio Nunes", "CN", 9, 14, 1133, false],
]

// Inputs fill with surface-2, which almost disappears on the page background:
// in the app they always sit on a white surface, so the demo does too.
function Surface({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={"flex flex-col gap-5 rounded-xl bg-card p-4 " + (className ?? "")}>{children}</div>
}

function Buttons() {
  return (
    <Block
      title="Botão"
      note="Pílula. Primário na tinta (roxo no claro, branco no escuro), um por tela; secundário em roxo 10%; contorno e fantasma na tinta; destrutivo é texto na rosa-tinta, confirmado em dialog. 48 px por padrão, 56 no momento-chave, 36 e 28 em linhas densas com área de toque de 44. Hover em #4A1E85, ativo afunda 1 px, foco com anel ciano, desabilitado a 45%. Nada de ouro em botão."
    >
      <Demo>
        <Row>
          <Button>Confirmar presença</Button>
          <Button variant="secondary">Ver ranking</Button>
          <Button variant="outline">Convidar</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="destructive">Encerrar partida</Button>
          <Button variant="link">Esqueci o código</Button>
        </Row>
        <Row>
          <Button size="lg">
            <Icon path={iconPath("whistle")} /> Começar partida
          </Button>
          <Button size="sm" variant="secondary">
            <Icon path={iconPath("substitution")} /> Troca
          </Button>
          <Button size="xs" variant="secondary">
            Ver
          </Button>
          <Button size="icon" variant="secondary" aria-label="Voltar">
            <Icon path={iconPath("back")} />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Mais ações">
            <Icon path={iconPath("more")} />
          </Button>
          <Button disabled>Desabilitado</Button>
          <Button disabled>
            <Spinner /> Salvando
          </Button>
        </Row>
      </Demo>
    </Block>
  )
}

function Fields() {
  return (
    <Block title="Campos" note="52 px, preenchidos em surface-2 sem borda, raio 12, ícone à esquerda em muted, rótulo acima em Manrope 600 14. Foco com anel ciano de 2 px; erro com anel e mensagem na rosa-tinta, com ícone; desabilitado a 45%. O código por e-mail são seis caixas de 48 × 56 em Rajdhani 24.">
      <Demo>
        <Surface>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="group-name">Nome do grupo</FieldLabel>
              <Input id="group-name" placeholder="Pelada de quinta" />
              <FieldDescription>Aparece no convite e no ranking.</FieldDescription>
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input id="email" type="email" icon={iconPath("email-outline")} aria-invalid defaultValue="thiago@" />
              <FieldError>
                <span className="inline-flex items-center gap-1.5">
                  <Icon path={iconPath("warning")} className="size-4" /> Esse e-mail não parece completo.
                </span>
              </FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="player-search">Buscar jogador</FieldLabel>
              <Input id="player-search" icon={iconPath("search")} placeholder="Nome ou apelido" />
            </Field>
            <Field>
              <FieldLabel htmlFor="team-count">Times por sessão</FieldLabel>
              <Select defaultValue="3" items={TEAM_COUNTS}>
                <SelectTrigger id="team-count" className="w-full">
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_COUNTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="notes">Observações</FieldLabel>
              <Textarea id="notes" placeholder="Quadra 2, entrada pelo portão lateral" rows={2} />
            </Field>
            <Field>
              <FieldLabel htmlFor="court">Quadra</FieldLabel>
              <Input id="court" icon={iconPath("location-outline")} disabled defaultValue="Arena Vila Mariana" />
            </Field>
          </FieldGroup>
          <Field>
            <FieldLabel>Código enviado para o seu e-mail</FieldLabel>
            <InputOTP maxLength={6} defaultValue="48">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription>Vale por 10 minutos.</FieldDescription>
          </Field>
        </Surface>
        <Surface className="gap-4">
          <Field orientation="horizontal">
            <Checkbox id="c1" defaultChecked />
            <FieldLabel htmlFor="c1">Vou jogar quinta</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="c2" />
            <FieldLabel htmlFor="c2">Levo colete</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Switch id="s1" defaultChecked />
            <FieldLabel htmlFor="s1">Goleiro fixo no grupo</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Switch id="s2" />
            <FieldLabel htmlFor="s2">Aceitar convidados</FieldLabel>
          </Field>
        </Surface>
      </Demo>
    </Block>
  )
}

function Chips() {
  return (
    <Block title="Chip e badge" note="Chip neutro em surface-2, 24 px, Manrope 600 12 em caixa de frase. A cor viva fica só no ponto de 8 px: verde para confirmado, rosa para faltou, a cor do tier na carta. Pendente, goleiro, novo e reserva não têm cor viva, só o texto (e o ícone, quando ajuda). O selo Ao vivo é a exceção: pílula vermelha cheia com texto e ponto brancos, o único lugar desse vermelho. Contagem em Rajdhani sobre a tinta.">
      <Demo>
        <Row>
          <Badge variant="success">Confirmado</Badge>
          <Badge variant="destructive">Faltou</Badge>
          <Badge variant="warning">
            <Icon path={iconPath("no-answer")} /> Pendente
          </Badge>
          <Badge variant="info">
            <Icon path={iconPath("goalkeeper")} /> Goleiro
          </Badge>
          <Badge variant="outline">Convidado</Badge>
          <Badge variant="live">Ao vivo</Badge>
        </Row>
        <Row>
          <Badge variant="count">12</Badge>
          <Badge variant="accent">Novo</Badge>
          <Badge>Admin</Badge>
          <Badge variant="secondary">Reserva</Badge>
          <Badge variant="bronze">Bronze</Badge>
          <Badge variant="silver">Prata</Badge>
          <Badge variant="gold">Ouro</Badge>
          <Badge variant="diamond">Diamante</Badge>
        </Row>
      </Demo>
    </Block>
  )
}

function Cards() {
  return (
    <Block title="Card" note="Superfície branca sobre a página, raio 16, sem borda e sem sombra: a elevação é só de tom. Card só para um objeto que se aciona (próximo jogo, resumo do jogador, carta do título); conjuntos são linhas, como na tabela abaixo.">
      <Demo>
        <Card>
          <CardHeader>
            <CardTitle>Quinta, 6 de novembro</CardTitle>
            <CardDescription>Arena Vila Mariana · 20h30 · 3 times</CardDescription>
            <CardAction>
              <Badge variant="success">14 confirmados</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <AvatarGroup>
              <Avatar>
                <AvatarFallback>LA</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback tone="lavender">RS</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>BT</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+11</AvatarGroupCount>
            </AvatarGroup>
            <span className="text-sm text-fg-2">Falta 1 goleiro</span>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">
              <Icon path={iconPath("attendance")} /> Confirmar
            </Button>
            <Button size="sm" variant="ghost">
              <Icon path={iconPath("share")} /> Convite
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Carta de jogador</CardTitle>
            <CardDescription>Bronze, prata, ouro e diamante, com o corte pequeno no canto e o ELO em Rajdhani.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg bg-surface-2 p-3 text-sm text-fg-2">
              <Logo svg={smallLogo} className="h-6 text-muted-foreground" />
              Desenho numa sessão própria.
            </div>
          </CardContent>
        </Card>
      </Demo>
    </Block>
  )
}

function Ranking() {
  return (
    <Block title="Tabela de ranking" note="Linhas planas num só contêiner branco de raio 16, separadas por hairline. Cabeçalho em caixa de frase, Manrope 600 12 muted. Posição e números em Rajdhani, à direita. A linha do próprio usuário em roxo 6% (prop self). O 1º lugar leva a coroa ouro pequena e nada mais é colorido.">
      <Demo>
        <div className="overflow-hidden rounded-xl bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                <TableHead>Jogador</TableHead>
                <TableHead className="text-right">J</TableHead>
                <TableHead className="text-right">Pts</TableHead>
                <TableHead className="text-right">ELO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RANKING.map(([pos, name, initials, j, pts, elo, self]) => (
                <TableRow key={pos} self={self}>
                  <TableCell className="text-right font-num text-base font-semibold text-foreground">
                    <span className="inline-flex items-center justify-end gap-1">
                      {pos === 1 ? <Icon path={iconPath("champion")} className="size-4 text-gold" title="1º lugar" /> : null}
                      {pos}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2.5">
                      <Avatar>
                        <AvatarFallback tone={pos % 2 ? "purple" : "lavender"}>{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-[15px] font-bold text-foreground">{self ? "Você" : name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-num text-base font-semibold">{j}</TableCell>
                  <TableCell className="text-right font-num text-base font-bold text-ink">{pts}</TableCell>
                  <TableCell className="text-right font-num text-base font-semibold">{elo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Demo>
    </Block>
  )
}

function TabsDemo() {
  return (
    <Block title="Tabs" note="Segmentado (padrão): a aba selecionada é a pílula cheia na tinta; as outras ficam em roxo 10% com texto roxo. Linha: sublinhado reto de 2 px na tinta sob a aba ativa, sobre a hairline da lista.">
      <Demo>
        <Tabs defaultValue="score">
          <TabsList>
            <TabsTrigger value="score">Marcar</TabsTrigger>
            <TabsTrigger value="timeline">Linha do tempo</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>
          <TabsContent value="score" className="pt-1 text-fg-2">
            Toque no jogador para marcar o gol.
          </TabsContent>
          <TabsContent value="timeline" className="pt-1 text-fg-2">
            Dois gols, um pênalti.
          </TabsContent>
          <TabsContent value="table" className="pt-1 text-fg-2">
            Vermelho lidera com 4 pontos.
          </TabsContent>
        </Tabs>
        <Tabs defaultValue="matches">
          <TabsList variant="line">
            <TabsTrigger value="matches">Partidas</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="settings" disabled>
              Ajustes
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Demo>
    </Block>
  )
}

function Overlays() {
  return (
    <Block title="Dialog, confirmação, folha, menu e seleção" note="Dialog e folha com raio 20 e a única sombra forte do sistema; o fundo escurece sem desfoque. A confirmação destrutiva tem o botão de texto na rosa-tinta. Menu e select sem sombra, item em foco em roxo 6%. Grupo de seleção: a opção escolhida é a pílula cheia na tinta; as outras em roxo 10% ou brancas.">
      <Demo>
        <Row>
          <Dialog>
            <DialogTrigger render={<Button />}>
              <Icon path={iconPath("whistle")} /> Encerrar partida
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Encerrar a partida?</DialogTitle>
                <DialogDescription>O placar 3 × 2 vira definitivo e o ELO dos dez jogadores é recalculado. Dá para corrigir depois pelo histórico.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="secondary" />}>Voltar</DialogClose>
                <DialogClose render={<Button />}>Encerrar</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>Remover jogador</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <Icon path={iconPath("delete")} />
                </AlertDialogMedia>
                <AlertDialogTitle>Remover Caio do grupo?</AlertDialogTitle>
                <AlertDialogDescription>Ele sai do ranking da temporada. O histórico das partidas fica.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Remover</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Sheet>
            <SheetTrigger render={<Button variant="secondary" />}>Folha inferior</SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Evento no minuto 7</SheetTitle>
                <SheetDescription>Quem fez e quem deu o passe.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-2 px-4 pb-4">
                <Button variant="secondary" className="justify-start">
                  <Icon path={iconPath("goal")} /> Gol
                </Button>
                <Button variant="secondary" className="justify-start">
                  <Icon path={iconPath("assist")} /> Assistência
                </Button>
                <Button variant="secondary" className="justify-start">
                  <Icon path={iconPath("penalty")} /> Pênalti
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Mais ações" />}>
              <Icon path={iconPath("more")} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sessão</DropdownMenuLabel>
              <DropdownMenuItem>
                <Icon path={iconPath("edit")} /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon path={iconPath("share")} /> Compartilhar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Icon path={iconPath("delete")} /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Como funciona o ELO" />}>
              <Icon path={iconPath("info")} />
            </TooltipTrigger>
            <TooltipContent>O ELO muda a cada partida encerrada.</TooltipContent>
          </Tooltip>
        </Row>
        <Row>
          <span className="text-sm font-semibold text-fg-2">Times</span>
          <ToggleGroup defaultValue={["3"]}>
            <ToggleGroupItem value="2" aria-label="2 times">
              2
            </ToggleGroupItem>
            <ToggleGroupItem value="3" aria-label="3 times">
              3
            </ToggleGroupItem>
            <ToggleGroupItem value="4" aria-label="4 times">
              4
            </ToggleGroupItem>
          </ToggleGroup>
        </Row>
        <Row>
          <ToggleGroup defaultValue={["10"]} variant="outline" size="sm">
            <ToggleGroupItem value="03">03/11</ToggleGroupItem>
            <ToggleGroupItem value="10">10/11 Hoje</ToggleGroupItem>
            <ToggleGroupItem value="17">17/11</ToggleGroupItem>
          </ToggleGroup>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Row>
      </Demo>
    </Block>
  )
}

function Notices() {
  return (
    <Block title="Toast, snackbar e alerta" note="Toast e alerta em superfície neutra, com ícone e texto na tinta: o estado está escrito no título, nunca num fundo vivo. O snackbar de desfazer é escuro (#1C1426), texto branco, ação Desfazer em lavanda, e some em cerca de 5 s: toastUndo(message, onUndo).">
      <Demo>
        <Row>
          <Button variant="secondary" size="sm" onClick={() => toast.success("Presença confirmada", { description: "Quinta, 20h30, Arena Vila Mariana." })}>
            Sucesso
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.warning("Sem goleiro no time B", { description: "O sorteio segue com linha no gol." })}>
            Aviso
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.error("Código inválido", { description: "Peça outro e tente de novo." })}>
            Erro
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast.info("Partida começou", { description: "O cronômetro está correndo." })}>
            Info
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => toastUndo("Gol de Dudu registrado", () => toast("Gol desfeito"), { icon: iconPath("goal") })}
          >
            <Icon path={iconPath("undo")} /> Snackbar de desfazer
          </Button>
        </Row>
        <div className="flex h-12 items-center gap-2 rounded-lg bg-snackbar pr-2 pl-4 text-white dark:ring-1 dark:ring-white/10" aria-hidden="true">
          <Icon path={iconPath("goal")} className="size-5" />
          <span className="flex-1 truncate text-sm font-semibold">Gol de Dudu registrado</span>
          <span className="inline-flex h-9 items-center px-3 text-sm font-bold text-lavender">Desfazer</span>
        </div>
        <div className="flex flex-col gap-2">
          <Alert variant="success">
            <Icon path={iconPath("success")} />
            <AlertTitle>Sessão encerrada</AlertTitle>
            <AlertDescription>O ELO dos dez jogadores foi recalculado.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <Icon path={iconPath("warning")} />
            <AlertTitle>Faltam 2 para fechar 3 times</AlertTitle>
            <AlertDescription>Com 10 confirmados, o sorteio sai com 2 times e 2 reservas.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <Icon path={iconPath("error")} />
            <AlertTitle>Não deu para salvar</AlertTitle>
            <AlertDescription>Sem conexão. O placar fica guardado no aparelho até voltar.</AlertDescription>
          </Alert>
          <Alert>
            <Icon path={iconPath("history")} />
            <AlertTitle>Temporada 2026/2</AlertTitle>
            <AlertDescription>Fecha em 18 de dezembro. O ELO continua; os pontos zeram.</AlertDescription>
          </Alert>
        </div>
      </Demo>
    </Block>
  )
}

function ProgressDemo() {
  return (
    <Block title="Progresso, esqueleto e carregando" note="Barra de 8 px na tinta sobre trilho em roxo 10%, valor em Rajdhani. Esqueleto em surface-2 enquanto o dado não chega. Spinner é o ícone loading do MDI girando.">
      <Demo>
        <Progress value={14} max={18}>
          <ProgressLabel>Confirmados</ProgressLabel>
          <ProgressValue>{() => "14 de 18"}</ProgressValue>
        </Progress>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Row>
          <Spinner className="size-5 text-ink" />
          <span className="text-sm text-fg-2">Sorteando os times…</span>
        </Row>
      </Demo>
    </Block>
  )
}

function Avatars() {
  return (
    <Block title="Avatar e estado vazio" note="24, 32, 40 e 56 px. Sem foto, iniciais em Lexend 600 brancas sobre roxo; tom lavanda com iniciais na tinta fica no lugar de uma foto. O anel ouro é só do campeão da noite. Estado vazio em superfície branca: símbolo esmaecido a 64 px, título em Lexend, texto curto e uma ação.">
      <Demo>
        <Row>
          <Avatar size="sm">
            <AvatarFallback>LA</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>RS</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback tone="lavender">BT</AvatarFallback>
          </Avatar>
          <Avatar size="xl">
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar size="xl" className="ring-3 ring-gold ring-offset-2 ring-offset-background">
            <AvatarFallback>DM</AvatarFallback>
          </Avatar>
          <span className="text-sm text-fg-2">Campeão da noite</span>
        </Row>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <Logo svg={symbolLogo} className="h-16 text-ink opacity-30" />
            </EmptyMedia>
            <EmptyTitle>Nenhuma pelada marcada</EmptyTitle>
            <EmptyDescription>Crie a primeira e mande o convite para a galera. A presença e o sorteio vêm junto.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>
              <Icon path={iconPath("add")} /> Marcar pelada
            </Button>
          </EmptyContent>
        </Empty>
      </Demo>
    </Block>
  )
}

export function Components() {
  return (
    <Section
      id="components"
      n="08 · Componentes"
      title="shadcn/ui, com a identidade por cima."
      lead={
        <>
          Cada componente é o do <a className="font-semibold text-ink underline underline-offset-4" href="https://ui.shadcn.com" target="_blank" rel="noreferrer">shadcn/ui</a> (Base UI, Tailwind 4), instalado pelo CLI e tematizado pelos tokens em <Code>packages/ui/src/styles/globals.css</Code>. O que mudou de verdade está no arquivo do componente, em <Code>packages/ui/src/components/ui/</Code>. O roxo conduz e a cor viva é sinal pequeno. Cada peça aparece nos dois temas, com estados ao vivo.
        </>
      }
    >
      <Buttons />
      <Fields />
      <Chips />
      <Cards />
      <Ranking />
      <TabsDemo />
      <Overlays />
      <Notices />
      <ProgressDemo />
      <Avatars />
      <p className="text-sm text-fg-2">
        Topos, navegação inferior, herói e placar ao vivo estão em <a className="font-semibold text-ink underline underline-offset-4" href="#screen-patterns">Padrões de tela</a>.
      </p>
    </Section>
  )
}
