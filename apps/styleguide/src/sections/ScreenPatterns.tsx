import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { iconPath } from "@meujogo/ui/icons"
import { PlayerAvatar } from "@meujogo/ui/components/mj/player-avatar"
import { HeaderButton, ImmersiveBlock, ImmersiveSheet, DetailHeader, ImmersiveHeader, RootHeader } from "@meujogo/ui/components/mj/header"
import { Hero, HeroAction, HeroNumber, HeroPill } from "@meujogo/ui/components/mj/hero"
import { BrandPattern } from "@meujogo/ui/components/mj/brand-pattern"
import { LiveDot, LiveBadge } from "@meujogo/ui/components/mj/live-badge"
import { Vest, VEST_NAMES, type VestColor } from "@meujogo/ui/components/mj/vest"
import { Scoreboard } from "@meujogo/ui/components/mj/scoreboard"
import { MatchTimer } from "@meujogo/ui/components/mj/match-timer"
import { BottomNav } from "@meujogo/ui/components/mj/bottom-nav"
import { StatusChip, ListRow, ListGroup, SectionTitle } from "@meujogo/ui/components/mj/list"
import { OperatorActions, PlayerRow, TeamPanel } from "@meujogo/ui/components/mj/operator"
import { Stat, StatGroup } from "@meujogo/ui/components/mj/stat"
import { BarChart, LineChart } from "@meujogo/ui/components/mj/chart"
import { InviteCard, LoginBackground } from "@meujogo/ui/components/mj/login"
import { BrandMark } from "@meujogo/ui/components/mj/brand-mark"
import { Section, Block, Demo, Code } from "./_shared"

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const ELO_LABELS = ["01/09", "08/09", "15/09", "22/09", "29/09", "06/10", "13/10", "20/10", "27/10", "03/11"]
const ELO_VALUES = [1198, 1211, 1204, 1226, 1240, 1233, 1251, 1262, 1273, 1287]

type Player = { id: string; name: string; initials: string; tone: "purple" | "light"; goalkeeper?: boolean }

const LINEUP: Record<"red" | "yellow", Player[]> = {
  red: [
    { id: "ma", name: "Marcão", initials: "MA", tone: "purple", goalkeeper: true },
    { id: "gu", name: "Guga", initials: "GU", tone: "purple" },
    { id: "te", name: "Teteu", initials: "TE", tone: "light" },
    { id: "sa", name: "Sandro", initials: "SA", tone: "purple" },
    { id: "pe", name: "Pedrão", initials: "PE", tone: "light" },
  ],
  yellow: [
    { id: "ju", name: "Juninho", initials: "JU", tone: "purple", goalkeeper: true },
    { id: "ra", name: "Rafa", initials: "RA", tone: "purple" },
    { id: "du", name: "Dudu", initials: "DU", tone: "light" },
    { id: "ca", name: "Caio", initials: "CA", tone: "purple" },
    { id: "vi", name: "Vitão", initials: "VI", tone: "light" },
  ],
}

const INITIAL_GOALS: Record<string, number> = { gu: 1, ra: 1, du: 1 }

const STANDINGS: { pos: number; color: VestColor; name: string; p: number; j: number; v: number; e: number; d: number; sg: string }[] = [
  { pos: 1, color: "red", name: "Vermelho", p: 4, j: 2, v: 1, e: 1, d: 0, sg: "+1" },
  { pos: 2, color: "black", name: "Preto", p: 3, j: 2, v: 1, e: 0, d: 1, sg: "0" },
  { pos: 3, color: "yellow", name: "Amarelo", p: 1, j: 2, v: 0, e: 1, d: 1, sg: "−1" },
]

const VEST_COLORS: VestColor[] = ["yellow", "red", "black", "blue", "white"]

/* ------------------------------------------------------------------ */
/* Peças da vitrine                                                    */
/* ------------------------------------------------------------------ */

function Phone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-border bg-background max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0", className)}>
      {children}
    </div>
  )
}

function Pills({ items, active, onChange }: { items: string[]; active: number; onChange?: (i: number) => void }) {
  return (
    <div role="tablist" className="flex items-center gap-2">
      {items.map((item, i) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={i === active}
          onClick={() => onChange?.(i)}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-4 text-[13px] leading-none font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring",
            i === active ? "bg-purple text-white dark:bg-white dark:text-purple" : "bg-tint-10 text-ink"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function Snackbar({ children, action }: { children: React.ReactNode; action: string }) {
  return (
    <div role="status" className="flex h-12 items-center gap-2 rounded-lg bg-snackbar pr-2 pl-4 text-white dark:bg-surface-2">
      <Icon path={iconPath("goal")} className="size-[18px]" />
      <span className="text-sm leading-tight font-semibold">{children}</span>
      <button type="button" className="ml-auto h-9 rounded-full px-3 text-sm font-bold text-lavender outline-none focus-visible:ring-3 focus-visible:ring-ring">
        {action}
      </button>
    </div>
  )
}

function Num({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-num font-semibold", className)}>{children}</span>
}

function useCountdown(start: number) {
  const [remaining, setRemaining] = React.useState(start)
  const [paused, setPaused] = React.useState(false)
  React.useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [paused])
  return { remaining, paused, toggle: () => setPaused((p) => !p) }
}

function LiveMatchTimer({ start = 438, initiallyPaused = false, className }: { start?: number; initiallyPaused?: boolean; className?: string }) {
  const r = useCountdown(start)
  const [held, setHeld] = React.useState(initiallyPaused)
  const paused = held || r.paused
  return (
    <MatchTimer
      className={className}
      remaining={r.remaining}
      duration={600}
      paused={paused}
      onToggle={() => (held ? setHeld(false) : r.toggle())}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Composições                                                         */
/* ------------------------------------------------------------------ */

function PerformanceCard() {
  return (
    <div className="flex flex-col gap-3">
      <SectionTitle title="Seu desempenho" action={<a href="#screen-patterns">Ver tudo</a>} />
      <div className="flex flex-col gap-4 rounded-xl bg-surface p-4">
        <div>
          <span className="block text-xs font-semibold text-muted-foreground">ELO</span>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="font-num text-5xl leading-none font-bold text-ink">1287</span>
            <StatusChip className="h-6">
              <span aria-hidden="true" className="size-2 rounded-full bg-tier-gold" />
              Ouro
            </StatusChip>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-ink">
            <Icon path={iconPath("up")} className="size-4" />
            <span className="font-num text-base font-bold">+14</span> na última sessão
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Evolução do ELO</span>
            <span className="font-medium">
              últimas <Num className="font-bold">10</Num> sessões
            </span>
          </div>
          <LineChart
            labels={ELO_LABELS}
            values={ELO_VALUES}
            min={1180}
            max={1300}
            step={40}
            references={[{ value: 1250, label: "Ouro" }]}
            accessibleLabel="Evolução do ELO nas últimas 10 sessões, de 1198 a 1287"
          />
        </div>
        <StatGroup className="border-t border-chart-grid pt-4">
          <Stat value="31" label="pts" />
          <Stat value="57%" label="aproveit." />
          <Stat value="12" label="gols" />
          <Stat value="7" label="assist." />
        </StatGroup>
        <div>
          <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Temporada 2026</span>
            <span className="font-medium">
              <Num className="font-bold">18</Num> jogos
            </span>
          </div>
          <BarChart
            labels={["Temporada"]}
            series={[
              { label: "Vitórias", abbreviation: "V", values: [9] },
              { label: "Empates", abbreviation: "E", values: [4] },
              { label: "Derrotas", abbreviation: "D", values: [5] },
            ]}
            horizontal
            stacked
            axes={false}
            max={18}
            height={56}
            accessibleLabel="Temporada 2026: 9 vitórias, 4 empates e 5 derrotas em 18 jogos"
          />
        </div>
      </div>
    </div>
  )
}

function DashboardTop() {
  return (
    <Phone>
      <RootHeader
        brand="primary"
        group="Racha do Bolinha"
        notifications={3}
        avatar={<PlayerAvatar initials="RF" size={32} />}
        onProfile={() => {}}
        title="Fala, Rodrigo"
        meta="Temporada 2026"
      />
      <div className="flex flex-col gap-6 px-4 pt-6 pb-6">
        <Hero action={<HeroAction>Confirmar presença</HeroAction>}>
          <div className="flex flex-col">
            <span className="font-num text-xl leading-tight font-semibold">Terça, 10/11 · 20h</span>
            <span className="mt-0.5 text-sm font-medium text-white/70">Arena Vila Madalena</span>
          </div>
          <div>
            <HeroNumber value="14/19" label="confirmados" />
            <p className="mt-1 text-sm text-white/80">Você ainda não respondeu</p>
          </div>
        </Hero>
        <PerformanceCard />
      </div>
      <BottomNav active="home" />
    </Phone>
  )
}

function LiveMatch() {
  const [goals, setGoals] = React.useState<Record<string, number>>(INITIAL_GOALS)
  const [history, setHistory] = React.useState<string[]>(["du"])
  const [tab, setTab] = React.useState(0)
  const score = (id: string) => {
    setGoals((g) => ({ ...g, [id]: (g[id] ?? 0) + 1 }))
    setHistory((u) => [...u, id])
  }
  const undo = () => {
    const id = history[history.length - 1]
    if (!id) return
    setGoals((g) => ({ ...g, [id]: Math.max(0, (g[id] ?? 0) - 1) }))
    setHistory((u) => u.slice(0, -1))
  }
  const teamGoals = (side: "red" | "yellow") => LINEUP[side].reduce((s, j) => s + (goals[j.id] ?? 0), 0)
  const lastScorer = [...LINEUP.red, ...LINEUP.yellow].find((j) => j.id === history[history.length - 1])?.name

  return (
    <Phone className="bg-surface">
      <ImmersiveBlock>
        <ImmersiveHeader
          title="Partida 4 de 6"
          subtitle="Racha do Bolinha · terça"
          onBack={() => {}}
          action={<HeaderButton tone="immersive" icon={iconPath("more-vertical")} label="Mais opções" />}
        />
        <div className="my-3 flex justify-center">
          <LiveBadge />
        </div>
        <Scoreboard
          home={{ color: "red", name: "Time Vermelho", goals: teamGoals("red"), scorers: ["Guga 2'"] }}
          away={{ color: "yellow", name: "Time Amarelo", goals: teamGoals("yellow"), scorers: ["Rafa 5' pen", "Dudu 7'"] }}
        />
        <LiveMatchTimer className="mt-4" />
      </ImmersiveBlock>
      <ImmersiveSheet>
        <Pills items={["Marcar", "Linha do tempo", "Tabela"]} active={tab} onChange={setTab} />
        <p className="text-[13px] leading-tight font-medium text-muted-foreground">Toque no jogador para marcar o gol</p>
        <div className="grid grid-cols-2 gap-3">
          {(["red", "yellow"] as const).map((side) => (
            <TeamPanel key={side} color={side} name={side === "red" ? "Vermelho" : "Amarelo"} goals={teamGoals(side)}>
              {LINEUP[side].map((j) => (
                <PlayerRow
                  key={j.id}
                  name={j.name}
                  initials={j.initials}
                  tone={j.tone}
                  goalkeeper={j.goalkeeper}
                  goals={goals[j.id]}
                  onScore={() => score(j.id)}
                />
              ))}
            </TeamPanel>
          ))}
        </div>
        <OperatorActions onUndo={undo} undoDisabled={!history.length} onFinish={() => {}} />
        {lastScorer ? <Snackbar action="Desfazer">Gol de {lastScorer} registrado</Snackbar> : null}
      </ImmersiveSheet>
    </Phone>
  )
}

function Login() {
  return (
    <Phone className="border-0">
      <LoginBackground className="min-h-0">
        <div className="flex flex-col px-4 pt-14 pb-10">
          <div className="flex justify-center">
            <BrandMark variant="primary" className="h-11 text-white" />
          </div>
          <div className="mt-10 text-center">
            <h1 className="font-display text-[28px] leading-tight font-semibold text-white">Entre para jogar</h1>
            <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-relaxed text-white/70">
              Use sua conta Google ou receba um código no e-mail.
            </p>
          </div>
          <InviteCard className="mt-7" initials="RB" group="Racha do Bolinha" detail="Arena Vila Madalena · terça 20h" />
          <div className="mt-7 flex flex-col gap-5">
            <button type="button" className="flex h-input w-full items-center justify-center gap-3 rounded-full bg-white text-base font-bold text-purple outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring">
              <Icon path={iconPath("google")} className="size-5" />
              Entrar com Google
            </button>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-sm text-white/55">ou</span>
              <span className="h-px flex-1 bg-white/15" />
            </div>
            <button type="button" className="flex h-input w-full items-center justify-center rounded-full border-[1.5px] border-white/70 text-base font-bold text-white outline-none hover:bg-white/[0.08] focus-visible:ring-3 focus-visible:ring-ring">
              Receber código
            </button>
          </div>
        </div>
      </LoginBackground>
    </Phone>
  )
}

/* ------------------------------------------------------------------ */
/* Seção                                                               */
/* ------------------------------------------------------------------ */

export function ScreenPatterns() {
  return (
    <Section
      id="screen-patterns"
      n="09 · Padrões de tela"
      title="Padrões de tela"
      lead={
        <>
          As peças compostas das telas do app, em <Code>@meujogo/ui/components/mj/*</Code>. O roxo conduz, a tela fica limpa: um herói por tela,
          listas em linhas, no máximo duas cores vivas.
        </>
      }
    >
      <Block title="Composições" note="O topo do Início e a partida ao vivo na visão do operador, montados só com as peças abaixo. Toque nos jogadores para marcar e em Desfazer último para voltar.">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DashboardTop />
          <LiveMatch />
        </div>
      </Block>

      <Block title="Topo raiz" note={<>Nas cinco abas. <Code>brand="primary"</Code> só no Início. Recolhido na rolagem: o título sai e a linha ganha hairline.</>}>
        <Demo>
          <Phone>
            <RootHeader
              group="Racha do Bolinha"
              notifications={3}
              avatar={<PlayerAvatar initials="RF" size={32} />}
              onProfile={() => {}}
              title="Próximo jogo"
              meta={
                <span className="flex flex-wrap items-center gap-x-2">
                  <span>Terça, 10/11 · 20h · Arena Vila Madalena</span>
                  <a href="#screen-patterns" className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Icon path={iconPath("location-outline")} className="size-[15px]" />
                    Como chegar
                  </a>
                </span>
              }
            />
            <div className="h-4" />
          </Phone>
          <Phone>
            <RootHeader
              brand="primary"
              group="Racha do Bolinha"
              notifications={12}
              avatar={<PlayerAvatar initials="RF" size={32} />}
              collapsed
            />
          </Phone>
        </Demo>
      </Block>

      <Block title="Topo de detalhe" note="Telas empilhadas: voltar redondo em roxo 10%, título centrado, no máximo uma ação.">
        <Demo>
          <Phone>
            <DetailHeader
              title="Sessão de terça"
              subtitle="10/11 · Arena Vila Madalena"
              onBack={() => {}}
              action={<HeaderButton icon={iconPath("share-outline")} label="Compartilhar" />}
            />
          </Phone>
        </Demo>
      </Block>

      <Block title="Topo imersivo" note="Dentro do bloco roxo de ponta a ponta; a folha branca de raio 24 sobe 24 px sobre ele.">
        <Demo>
          <Phone className="bg-surface">
            <ImmersiveBlock className="pb-12">
              <ImmersiveHeader
                title="Partida 4 de 6"
                subtitle="Racha do Bolinha · terça"
                onBack={() => {}}
                action={<HeaderButton tone="immersive" icon={iconPath("more-vertical")} label="Mais opções" />}
              />
            </ImmersiveBlock>
            <ImmersiveSheet>
              <Pills items={["Marcar", "Linha do tempo", "Tabela"]} active={0} />
            </ImmersiveSheet>
          </Phone>
        </Demo>
      </Block>

      <Block title="Herói" note="Um por tela, raio 20, padrão branco saindo de um canto, o número-chave e no máximo uma ação. O par de resposta é a única exceção.">
        <Demo>
          <div className="mx-auto flex w-full max-w-[358px] flex-col gap-4">
            <Hero
              action={
                <>
                  <HeroAction>
                    <Icon path={iconPath("check")} />
                    Vou jogar
                  </HeroAction>
                  <HeroAction variant="outline">Não vou</HeroAction>
                </>
              }
            >
              <div>
                <HeroNumber value="12" label="de linha confirmados" />
                <p className="mt-1 text-sm text-white/80">
                  <Num>3</Num> times fechados · <Num>1</Num> na fila
                </p>
              </div>
              <div className="flex items-center gap-2">
                <HeroPill>
                  Goleiros <Num className="font-bold">2/2</Num>
                </HeroPill>
                <HeroPill>
                  Total <Num className="font-bold">14</Num> de <Num className="font-bold">19</Num>
                </HeroPill>
              </div>
            </Hero>
            <Hero pattern="rhythm" action={<HeroAction>Ver ao vivo</HeroAction>}>
              <HeroNumber value={<>3 <span className="font-body text-xl font-semibold">de</span> 6</>} label="partidas jogadas" />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-1/2 rounded-full bg-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Partida 4 em andamento</span>
                <LiveBadge pulse={false} />
              </div>
            </Hero>
          </div>
        </Demo>
      </Block>

      <Block title="Selo ao vivo e colete" note="O vermelho ao vivo só existe no selo e no ponto da linha ao vivo. O colete é sempre o ícone na cor real, ao lado do nome; o branco leva fio, o preto ganha fio no escuro.">
        <Demo>
          <div className="flex flex-wrap items-center gap-4">
            <LiveBadge />
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 font-num text-lg font-semibold text-foreground">
              1 × 2 <LiveDot />
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {VEST_COLORS.map((c) => (
              <span key={c} className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <Vest color={c} />
                {VEST_NAMES[c]}
              </span>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <Vest color="white" size="sm" />
            <Vest color="white" size="lg" />
            <Vest color="yellow" size="lg" outline />
            <span className="relative flex gap-3 overflow-hidden rounded-xl bg-hero p-3">
              {VEST_COLORS.map((c) => (
                <span key={c} className="flex size-12 items-center justify-center rounded-full bg-on-hero-12">
                  <Vest color={c} size="lg" outline={false} className="size-8" />
                </span>
              ))}
            </span>
          </div>
        </Demo>
      </Block>

      <Block title="Placar e cronômetro" note="O cronômetro é controlado: pausado, o rótulo diz Pausado e o trilho para. O botão tem 36 px e área de toque de 44.">
        <Demo>
          <div className="relative overflow-hidden rounded-2xl bg-hero px-4 py-6">
            <BrandPattern pattern="impulse" fade="diagonal" position="-top-10 -right-[60px] size-[400px]" />
            <div className="relative flex flex-col gap-4">
              <Scoreboard
                home={{ color: "red", name: "Time Vermelho", goals: 1, scorers: ["Guga 2'"] }}
                away={{ color: "yellow", name: "Time Amarelo", goals: 2, scorers: ["Rafa 5' pen", "Dudu 7'"] }}
              />
              <div className="flex flex-wrap justify-center gap-6">
                <LiveMatchTimer />
                <LiveMatchTimer start={262} initiallyPaused />
              </div>
            </div>
          </div>
        </Demo>
      </Block>

      <Block title="Navegação inferior" note="Branca, hairline em cima, cinco itens. Ativo com ícone cheio sobre pílula roxo 10%; inativo em contorno.">
        <Demo>
          <Phone className="rounded-xl">
            <BottomNav active="home" />
          </Phone>
          <Phone className="rounded-xl">
            <BottomNav active="game" />
          </Phone>
        </Demo>
      </Block>

      <Block title="Listas" note="Linhas num contêiner branco de raio 16 com hairline recuada. A linha do usuário em roxo 6%; estados em chip neutro com o estado escrito.">
        <Demo>
          <div className="flex flex-col gap-5">
            <ListGroup title="Goleiros">
              <ListRow
                height="tall"
                start={<PlayerAvatar initials="M" />}
                title="Marcão"
                meta={<>Goleiro fixo · ELO <Num>1342</Num></>}
                end={<StatusChip dot="confirmed">Confirmado</StatusChip>}
              />
              <ListRow
                height="tall"
                start={<PlayerAvatar initials="J" tone="light" />}
                title="Juninho"
                meta={<>Goleiro fixo · ELO <Num>1198</Num></>}
                end={<StatusChip dot="confirmed">Confirmado</StatusChip>}
              />
            </ListGroup>
            <ListGroup title="Linha">
              <ListRow
                height="tall"
                self
                start={<PlayerAvatar initials="RF" />}
                title="Rodrigo Ferraz"
                meta={<>Você · ELO <Num>1287</Num></>}
                end={<StatusChip icon={iconPath("no-answer")}>Sem resposta</StatusChip>}
              />
              <ListRow
                height="tall"
                start={<PlayerAvatar initials="I" />}
                title="Igor"
                meta={<>ELO <Num>1098</Num></>}
                end={<StatusChip icon={iconPath("queue")}><Num className="font-bold">1º</Num> na fila</StatusChip>}
              />
              <ListRow
                height="tall"
                start={<PlayerAvatar initials="L" />}
                title="Lucão"
                meta={<>ELO <Num>1211</Num></>}
                end={<StatusChip icon={iconPath("injured")}>Lesionado</StatusChip>}
              />
              <ListRow
                height="tall"
                start={<PlayerAvatar initials="BS" />}
                title="Bruno Sapo"
                meta={<>ELO <Num>1063</Num></>}
                end={<StatusChip dot="absent">Não vai</StatusChip>}
              />
            </ListGroup>
          </div>
          <div className="flex flex-col gap-5">
            <ListGroup title="Classificação">
              {STANDINGS.map((t) => (
                <ListRow
                  key={t.name}
                  start={
                    <span className="flex items-center gap-2">
                      <span className="flex w-8 items-center gap-1">
                        <Num className={cn("text-base", t.pos === 1 ? "font-bold text-foreground" : "text-muted-foreground")}>{t.pos}</Num>
                        {t.pos === 1 ? <Icon path={iconPath("champion")} title="1º lugar" className="size-4 text-gold" /> : null}
                      </span>
                      <Vest color={t.color} />
                    </span>
                  }
                  title={t.name}
                  meta={
                    <>
                      <Num>{t.j}</Num> J · <Num>{t.v}</Num> V · <Num>{t.e}</Num> E · <Num>{t.d}</Num> D · saldo <Num>{t.sg}</Num>
                    </>
                  }
                  end={
                    <span className="flex items-baseline gap-1">
                      <Num className="text-lg font-bold text-foreground">{t.p}</Num>
                      <span className="text-xs font-medium text-muted-foreground">pts</span>
                    </span>
                  }
                />
              ))}
            </ListGroup>
            <ListGroup title="Grupo" action={<a href="#screen-patterns">Editar</a>}>
              <ListRow start={<Icon path={iconPath("season")} className="size-5 text-ink" />} title="Temporada 2026" end={<Num className="text-muted-foreground">18 jogos</Num>} chevron onClick={() => {}} />
              <ListRow start={<Icon path={iconPath("group")} className="size-5 text-ink" />} title="Jogadores" end={<Num className="text-muted-foreground">19</Num>} chevron onClick={() => {}} />
              <ListRow start={<Icon path={iconPath("invite")} className="size-5 text-ink" />} title="Convidar para o grupo" chevron href="#screen-patterns" />
            </ListGroup>
          </div>
        </Demo>
      </Block>

      <Block title="Painel do operador" note="Na aba Marcar: um painel por time, goleiro primeiro, linhas de toque de 48 px. Embaixo, as ações secundárias e o encerrar em rosa-tinta.">
        <Demo>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <TeamPanel color="red" name="Vermelho" goals={1}>
                {LINEUP.red.slice(0, 3).map((j) => (
                  <PlayerRow key={j.id} name={j.name} initials={j.initials} tone={j.tone} goalkeeper={j.goalkeeper} goals={INITIAL_GOALS[j.id]} onScore={() => {}} />
                ))}
              </TeamPanel>
              <TeamPanel color="yellow" name="Amarelo" goals={2}>
                {LINEUP.yellow.slice(0, 3).map((j) => (
                  <PlayerRow key={j.id} name={j.name} initials={j.initials} tone={j.tone} goalkeeper={j.goalkeeper} goals={INITIAL_GOALS[j.id]} onScore={() => {}} />
                ))}
              </TeamPanel>
            </div>
            <OperatorActions onOwnGoal={() => {}} onPenalty={() => {}} onUndo={() => {}} onFinish={() => {}} />
          </div>
        </Demo>
      </Block>

      <Block title="Estatística e gráficos" note="Chart.js só em roxo: linha de 2,5 px com área de 18% a 0, último ponto destacado, tier em tracejado, sem legenda com uma série. As cores vêm dos tokens e acompanham o tema.">
        <Demo>
          <div className="flex flex-col gap-4 rounded-xl bg-surface p-4">
            <StatGroup>
              <Stat value="31" label="pts" />
              <Stat value="57%" label="aproveit." />
              <Stat value="12" label="gols" />
              <Stat value="7" label="assist." />
            </StatGroup>
            <LineChart
              labels={ELO_LABELS}
              values={ELO_VALUES}
              min={1180}
              max={1300}
              step={40}
              references={[{ value: 1250, label: "Ouro" }]}
              accessibleLabel="Evolução do ELO nas últimas 10 sessões, de 1198 a 1287"
            />
            <BarChart
              labels={["06/10", "13/10", "20/10", "27/10", "03/11"]}
              series={[{ label: "Gols", values: [2, 0, 3, 1, 2] }]}
              height={140}
              accessibleLabel="Gols por sessão nas últimas 5 sessões: 2, 0, 3, 1 e 2"
            />
          </div>
        </Demo>
      </Block>

      <Block title="Login" note="Fundo de tela cheia com o impulso a 6% e o convite em branco 8%. É o único lugar com campo translúcido.">
        <div className="max-w-[390px]">
          <Login />
        </div>
      </Block>
    </Section>
  )
}
