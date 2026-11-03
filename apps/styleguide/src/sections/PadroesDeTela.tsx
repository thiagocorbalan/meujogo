import * as React from "react"
import { cn } from "@meujogo/ui/lib/utils"
import { Icon } from "@meujogo/ui/components/icon"
import { icone } from "@meujogo/ui/icones"
import { AvatarJogador } from "@meujogo/ui/components/mj/avatar-jogador"
import { BotaoTopo, BlocoImersivo, FolhaImersiva, HeaderDetalhe, HeaderImersivo, HeaderRaiz } from "@meujogo/ui/components/mj/header"
import { Heroi, HeroiAcao, HeroiNumero, HeroiPilula } from "@meujogo/ui/components/mj/heroi"
import { Padrao } from "@meujogo/ui/components/mj/padrao"
import { PontoAoVivo, SeloAoVivo } from "@meujogo/ui/components/mj/selo-ao-vivo"
import { Colete, type CorColete } from "@meujogo/ui/components/mj/colete"
import { Placar } from "@meujogo/ui/components/mj/placar"
import { Cronometro } from "@meujogo/ui/components/mj/cronometro"
import { NavInferior } from "@meujogo/ui/components/mj/nav-inferior"
import { ChipEstado, LinhaLista, ListaGrupo, TituloSecao } from "@meujogo/ui/components/mj/lista"
import { AcoesOperador, LinhaJogador, PainelTime } from "@meujogo/ui/components/mj/operador"
import { Estatistica, GrupoEstatisticas } from "@meujogo/ui/components/mj/estatistica"
import { GraficoBarras, GraficoLinha } from "@meujogo/ui/components/mj/grafico"
import { CartaoConvite, FundoLogin } from "@meujogo/ui/components/mj/login"
import { Marca } from "@meujogo/ui/components/mj/marca"
import { Section, Bloco, Demo, Code } from "./_shared"

/* ------------------------------------------------------------------ */
/* Dados de exemplo                                                    */
/* ------------------------------------------------------------------ */

const ELO_ROTULOS = ["01/09", "08/09", "15/09", "22/09", "29/09", "06/10", "13/10", "20/10", "27/10", "03/11"]
const ELO_VALORES = [1198, 1211, 1204, 1226, 1240, 1233, 1251, 1262, 1273, 1287]

type Jogador = { id: string; nome: string; iniciais: string; tom: "roxo" | "claro"; goleiro?: boolean }

const ESCALACAO: Record<"vermelho" | "amarelo", Jogador[]> = {
  vermelho: [
    { id: "ma", nome: "Marcão", iniciais: "MA", tom: "roxo", goleiro: true },
    { id: "gu", nome: "Guga", iniciais: "GU", tom: "roxo" },
    { id: "te", nome: "Teteu", iniciais: "TE", tom: "claro" },
    { id: "sa", nome: "Sandro", iniciais: "SA", tom: "roxo" },
    { id: "pe", nome: "Pedrão", iniciais: "PE", tom: "claro" },
  ],
  amarelo: [
    { id: "ju", nome: "Juninho", iniciais: "JU", tom: "roxo", goleiro: true },
    { id: "ra", nome: "Rafa", iniciais: "RA", tom: "roxo" },
    { id: "du", nome: "Dudu", iniciais: "DU", tom: "claro" },
    { id: "ca", nome: "Caio", iniciais: "CA", tom: "roxo" },
    { id: "vi", nome: "Vitão", iniciais: "VI", tom: "claro" },
  ],
}

const GOLS_INICIAIS: Record<string, number> = { gu: 1, ra: 1, du: 1 }

const CLASSIFICACAO: { pos: number; cor: CorColete; nome: string; p: number; j: number; v: number; e: number; d: number; sg: string }[] = [
  { pos: 1, cor: "vermelho", nome: "Vermelho", p: 4, j: 2, v: 1, e: 1, d: 0, sg: "+1" },
  { pos: 2, cor: "preto", nome: "Preto", p: 3, j: 2, v: 1, e: 0, d: 1, sg: "0" },
  { pos: 3, cor: "amarelo", nome: "Amarelo", p: 1, j: 2, v: 0, e: 1, d: 1, sg: "−1" },
]

const CORES: CorColete[] = ["amarelo", "vermelho", "preto", "azul", "branco"]

/* ------------------------------------------------------------------ */
/* Peças da vitrine                                                    */
/* ------------------------------------------------------------------ */

function Fone({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-border bg-background max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] max-sm:max-w-none max-sm:rounded-none max-sm:border-x-0", className)}>
      {children}
    </div>
  )
}

function Pilulas({ itens, ativo, onTrocar }: { itens: string[]; ativo: number; onTrocar?: (i: number) => void }) {
  return (
    <div role="tablist" className="flex items-center gap-2">
      {itens.map((item, i) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={i === ativo}
          onClick={() => onTrocar?.(i)}
          className={cn(
            "inline-flex h-9 items-center rounded-full px-4 text-[13px] leading-none font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring",
            i === ativo ? "bg-roxo text-white dark:bg-white dark:text-roxo" : "bg-tint-10 text-ink"
          )}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function Snackbar({ children, acao }: { children: React.ReactNode; acao: string }) {
  return (
    <div role="status" className="flex h-12 items-center gap-2 rounded-lg bg-snackbar pr-2 pl-4 text-white dark:bg-surface-2">
      <Icon path={icone("gol")} className="size-[18px]" />
      <span className="text-sm leading-tight font-semibold">{children}</span>
      <button type="button" className="ml-auto h-9 rounded-full px-3 text-sm font-bold text-lavanda outline-none focus-visible:ring-3 focus-visible:ring-ring">
        {acao}
      </button>
    </div>
  )
}

function Num({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("font-num font-semibold", className)}>{children}</span>
}

function useRelogio(inicio: number) {
  const [restante, setRestante] = React.useState(inicio)
  const [pausado, setPausado] = React.useState(false)
  React.useEffect(() => {
    if (pausado) return
    const id = window.setInterval(() => setRestante((s) => Math.max(0, s - 1)), 1000)
    return () => window.clearInterval(id)
  }, [pausado])
  return { restante, pausado, alternar: () => setPausado((p) => !p) }
}

function CronometroVivo({ inicio = 438, pausadoInicial = false, className }: { inicio?: number; pausadoInicial?: boolean; className?: string }) {
  const r = useRelogio(inicio)
  const [primeiro, setPrimeiro] = React.useState(pausadoInicial)
  const pausado = primeiro || r.pausado
  return (
    <Cronometro
      className={className}
      restante={r.restante}
      duracao={600}
      pausado={pausado}
      onAlternar={() => (primeiro ? setPrimeiro(false) : r.alternar())}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Composições                                                         */
/* ------------------------------------------------------------------ */

function CartaoDesempenho() {
  return (
    <div className="flex flex-col gap-3">
      <TituloSecao titulo="Seu desempenho" acao={<a href="#padroes-de-tela">Ver tudo</a>} />
      <div className="flex flex-col gap-4 rounded-xl bg-surface p-4">
        <div>
          <span className="block text-xs font-semibold text-muted-foreground">ELO</span>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="font-num text-5xl leading-none font-bold text-ink">1287</span>
            <ChipEstado className="h-6">
              <span aria-hidden="true" className="size-2 rounded-full bg-tier-ouro" />
              Ouro
            </ChipEstado>
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-ink">
            <Icon path={icone("subiu")} className="size-4" />
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
          <GraficoLinha
            rotulos={ELO_ROTULOS}
            valores={ELO_VALORES}
            min={1180}
            max={1300}
            passo={40}
            referencias={[{ valor: 1250, rotulo: "Ouro" }]}
            rotuloAcessivel="Evolução do ELO nas últimas 10 sessões, de 1198 a 1287"
          />
        </div>
        <GrupoEstatisticas className="border-t border-chart-grid pt-4">
          <Estatistica valor="31" rotulo="pts" />
          <Estatistica valor="57%" rotulo="aproveit." />
          <Estatistica valor="12" rotulo="gols" />
          <Estatistica valor="7" rotulo="assist." />
        </GrupoEstatisticas>
        <div>
          <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Temporada 2026</span>
            <span className="font-medium">
              <Num className="font-bold">18</Num> jogos
            </span>
          </div>
          <GraficoBarras
            rotulos={["Temporada"]}
            series={[
              { rotulo: "Vitórias", abreviacao: "V", valores: [9] },
              { rotulo: "Empates", abreviacao: "E", valores: [4] },
              { rotulo: "Derrotas", abreviacao: "D", valores: [5] },
            ]}
            horizontal
            empilhado
            eixos={false}
            max={18}
            altura={56}
            rotuloAcessivel="Temporada 2026: 9 vitórias, 4 empates e 5 derrotas em 18 jogos"
          />
        </div>
      </div>
    </div>
  )
}

function TopoDashboard() {
  return (
    <Fone>
      <HeaderRaiz
        marca="principal"
        grupo="Racha do Bolinha"
        notificacoes={3}
        avatar={<AvatarJogador iniciais="RF" tamanho={32} />}
        onPerfil={() => {}}
        titulo="Fala, Rodrigo"
        meta="Temporada 2026"
      />
      <div className="flex flex-col gap-6 px-4 pt-6 pb-6">
        <Heroi acao={<HeroiAcao>Confirmar presença</HeroiAcao>}>
          <div className="flex flex-col">
            <span className="font-num text-xl leading-tight font-semibold">Terça, 10/11 · 20h</span>
            <span className="mt-0.5 text-sm font-medium text-white/70">Arena Vila Madalena</span>
          </div>
          <div>
            <HeroiNumero valor="14/19" rotulo="confirmados" />
            <p className="mt-1 text-sm text-white/80">Você ainda não respondeu</p>
          </div>
        </Heroi>
        <CartaoDesempenho />
      </div>
      <NavInferior ativo="inicio" />
    </Fone>
  )
}

function AoVivo() {
  const [gols, setGols] = React.useState<Record<string, number>>(GOLS_INICIAIS)
  const [ultimo, setUltimo] = React.useState<string[]>(["du"])
  const [aba, setAba] = React.useState(0)
  const marcar = (id: string) => {
    setGols((g) => ({ ...g, [id]: (g[id] ?? 0) + 1 }))
    setUltimo((u) => [...u, id])
  }
  const desfazer = () => {
    const id = ultimo[ultimo.length - 1]
    if (!id) return
    setGols((g) => ({ ...g, [id]: Math.max(0, (g[id] ?? 0) - 1) }))
    setUltimo((u) => u.slice(0, -1))
  }
  const placar = (lado: "vermelho" | "amarelo") => ESCALACAO[lado].reduce((s, j) => s + (gols[j.id] ?? 0), 0)
  const nomeUltimo = [...ESCALACAO.vermelho, ...ESCALACAO.amarelo].find((j) => j.id === ultimo[ultimo.length - 1])?.nome

  return (
    <Fone className="bg-surface">
      <BlocoImersivo>
        <HeaderImersivo
          titulo="Partida 4 de 6"
          subtitulo="Racha do Bolinha · terça"
          onVoltar={() => {}}
          acao={<BotaoTopo tom="imersivo" icone={icone("mais-vertical")} rotulo="Mais opções" />}
        />
        <div className="my-3 flex justify-center">
          <SeloAoVivo />
        </div>
        <Placar
          casa={{ cor: "vermelho", nome: "Time Vermelho", gols: placar("vermelho"), marcadores: ["Guga 2'"] }}
          visitante={{ cor: "amarelo", nome: "Time Amarelo", gols: placar("amarelo"), marcadores: ["Rafa 5' pen", "Dudu 7'"] }}
        />
        <CronometroVivo className="mt-4" />
      </BlocoImersivo>
      <FolhaImersiva>
        <Pilulas itens={["Marcar", "Linha do tempo", "Tabela"]} ativo={aba} onTrocar={setAba} />
        <p className="text-[13px] leading-tight font-medium text-muted-foreground">Toque no jogador para marcar o gol</p>
        <div className="grid grid-cols-2 gap-3">
          {(["vermelho", "amarelo"] as const).map((lado) => (
            <PainelTime key={lado} cor={lado} nome={lado === "vermelho" ? "Vermelho" : "Amarelo"} gols={placar(lado)}>
              {ESCALACAO[lado].map((j) => (
                <LinhaJogador
                  key={j.id}
                  nome={j.nome}
                  iniciais={j.iniciais}
                  tom={j.tom}
                  goleiro={j.goleiro}
                  gols={gols[j.id]}
                  onMarcar={() => marcar(j.id)}
                />
              ))}
            </PainelTime>
          ))}
        </div>
        <AcoesOperador onDesfazer={desfazer} desfazerDesabilitado={!ultimo.length} onEncerrar={() => {}} />
        {nomeUltimo ? <Snackbar acao="Desfazer">Gol de {nomeUltimo} registrado</Snackbar> : null}
      </FolhaImersiva>
    </Fone>
  )
}

function Login() {
  return (
    <Fone className="border-0">
      <FundoLogin className="min-h-0">
        <div className="flex flex-col px-4 pt-14 pb-10">
          <div className="flex justify-center">
            <Marca versao="principal" className="h-11 text-white" />
          </div>
          <div className="mt-10 text-center">
            <h1 className="font-display text-[28px] leading-tight font-semibold text-white">Entre para jogar</h1>
            <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-relaxed text-white/70">
              Use sua conta Google ou receba um código no e-mail.
            </p>
          </div>
          <CartaoConvite className="mt-7" iniciais="RB" grupo="Racha do Bolinha" detalhe="Arena Vila Madalena · terça 20h" />
          <div className="mt-7 flex flex-col gap-5">
            <button type="button" className="flex h-input w-full items-center justify-center gap-3 rounded-full bg-white text-base font-bold text-roxo outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring">
              <Icon path={icone("google")} className="size-5" />
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
      </FundoLogin>
    </Fone>
  )
}

/* ------------------------------------------------------------------ */
/* Seção                                                               */
/* ------------------------------------------------------------------ */

export function PadroesDeTela() {
  return (
    <Section
      id="padroes-de-tela"
      n="09 · Padrões de tela"
      titulo="Padrões de tela"
      lead={
        <>
          As peças compostas das telas do app, em <Code>@meujogo/ui/components/mj/*</Code>. O roxo conduz, a tela fica limpa: um herói por tela,
          listas em linhas, no máximo duas cores vivas.
        </>
      }
    >
      <Bloco titulo="Composições" nota="O topo do Início e a partida ao vivo na visão do operador, montados só com as peças abaixo. Toque nos jogadores para marcar e em Desfazer último para voltar.">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <TopoDashboard />
          <AoVivo />
        </div>
      </Bloco>

      <Bloco titulo="Topo raiz" nota={<>Nas cinco abas. <Code>marca="principal"</Code> só no Início. Recolhido na rolagem: o título sai e a linha ganha hairline.</>}>
        <Demo>
          <Fone>
            <HeaderRaiz
              grupo="Racha do Bolinha"
              notificacoes={3}
              avatar={<AvatarJogador iniciais="RF" tamanho={32} />}
              onPerfil={() => {}}
              titulo="Próximo jogo"
              meta={
                <span className="flex flex-wrap items-center gap-x-2">
                  <span>Terça, 10/11 · 20h · Arena Vila Madalena</span>
                  <a href="#padroes-de-tela" className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Icon path={icone("local-contorno")} className="size-[15px]" />
                    Como chegar
                  </a>
                </span>
              }
            />
            <div className="h-4" />
          </Fone>
          <Fone>
            <HeaderRaiz
              marca="principal"
              grupo="Racha do Bolinha"
              notificacoes={12}
              avatar={<AvatarJogador iniciais="RF" tamanho={32} />}
              recolhido
            />
          </Fone>
        </Demo>
      </Bloco>

      <Bloco titulo="Topo de detalhe" nota="Telas empilhadas: voltar redondo em roxo 10%, título centrado, no máximo uma ação.">
        <Demo>
          <Fone>
            <HeaderDetalhe
              titulo="Sessão de terça"
              subtitulo="10/11 · Arena Vila Madalena"
              onVoltar={() => {}}
              acao={<BotaoTopo icone={icone("compartilhar-contorno")} rotulo="Compartilhar" />}
            />
          </Fone>
        </Demo>
      </Bloco>

      <Bloco titulo="Topo imersivo" nota="Dentro do bloco roxo de ponta a ponta; a folha branca de raio 24 sobe 24 px sobre ele.">
        <Demo>
          <Fone className="bg-surface">
            <BlocoImersivo className="pb-12">
              <HeaderImersivo
                titulo="Partida 4 de 6"
                subtitulo="Racha do Bolinha · terça"
                onVoltar={() => {}}
                acao={<BotaoTopo tom="imersivo" icone={icone("mais-vertical")} rotulo="Mais opções" />}
              />
            </BlocoImersivo>
            <FolhaImersiva>
              <Pilulas itens={["Marcar", "Linha do tempo", "Tabela"]} ativo={0} />
            </FolhaImersiva>
          </Fone>
        </Demo>
      </Bloco>

      <Bloco titulo="Herói" nota="Um por tela, raio 20, padrão branco saindo de um canto, o número-chave e no máximo uma ação. O par de resposta é a única exceção.">
        <Demo>
          <div className="mx-auto flex w-full max-w-[358px] flex-col gap-4">
            <Heroi
              acao={
                <>
                  <HeroiAcao>
                    <Icon path={icone("marcar")} />
                    Vou jogar
                  </HeroiAcao>
                  <HeroiAcao variante="contorno">Não vou</HeroiAcao>
                </>
              }
            >
              <div>
                <HeroiNumero valor="12" rotulo="de linha confirmados" />
                <p className="mt-1 text-sm text-white/80">
                  <Num>3</Num> times fechados · <Num>1</Num> na fila
                </p>
              </div>
              <div className="flex items-center gap-2">
                <HeroiPilula>
                  Goleiros <Num className="font-bold">2/2</Num>
                </HeroiPilula>
                <HeroiPilula>
                  Total <Num className="font-bold">14</Num> de <Num className="font-bold">19</Num>
                </HeroiPilula>
              </div>
            </Heroi>
            <Heroi padrao="ritmo" acao={<HeroiAcao>Ver ao vivo</HeroiAcao>}>
              <HeroiNumero valor={<>3 <span className="font-body text-xl font-semibold">de</span> 6</>} rotulo="partidas jogadas" />
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full w-1/2 rounded-full bg-white" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Partida 4 em andamento</span>
                <SeloAoVivo pulsar={false} />
              </div>
            </Heroi>
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Selo ao vivo e colete" nota="O vermelho ao vivo só existe no selo e no ponto da linha ao vivo. O colete é sempre o ícone na cor real, ao lado do nome; o branco leva fio, o preto ganha fio no escuro.">
        <Demo>
          <div className="flex flex-wrap items-center gap-4">
            <SeloAoVivo />
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 font-num text-lg font-semibold text-foreground">
              1 × 2 <PontoAoVivo />
            </span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {CORES.map((c) => (
              <span key={c} className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
                <Colete cor={c} />
                {c[0].toUpperCase() + c.slice(1)}
              </span>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <Colete cor="branco" tamanho="sm" />
            <Colete cor="branco" tamanho="lg" />
            <Colete cor="amarelo" tamanho="lg" contorno />
            <span className="relative flex gap-3 overflow-hidden rounded-xl bg-hero p-3">
              {CORES.map((c) => (
                <span key={c} className="flex size-12 items-center justify-center rounded-full bg-on-hero-12">
                  <Colete cor={c} tamanho="lg" contorno={false} className="size-8" />
                </span>
              ))}
            </span>
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Placar e cronômetro" nota="O cronômetro é controlado: pausado, o rótulo diz Pausado e o trilho para. O botão tem 36 px e área de toque de 44.">
        <Demo>
          <div className="relative overflow-hidden rounded-2xl bg-hero px-4 py-6">
            <Padrao padrao="impulso" esmaecer="diagonal" posicao="-top-10 -right-[60px] size-[400px]" />
            <div className="relative flex flex-col gap-4">
              <Placar
                casa={{ cor: "vermelho", nome: "Time Vermelho", gols: 1, marcadores: ["Guga 2'"] }}
                visitante={{ cor: "amarelo", nome: "Time Amarelo", gols: 2, marcadores: ["Rafa 5' pen", "Dudu 7'"] }}
              />
              <div className="flex flex-wrap justify-center gap-6">
                <CronometroVivo />
                <CronometroVivo inicio={262} pausadoInicial />
              </div>
            </div>
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Navegação inferior" nota="Branca, hairline em cima, cinco itens. Ativo com ícone cheio sobre pílula roxo 10%; inativo em contorno.">
        <Demo>
          <Fone className="rounded-xl">
            <NavInferior ativo="inicio" />
          </Fone>
          <Fone className="rounded-xl">
            <NavInferior ativo="jogo" />
          </Fone>
        </Demo>
      </Bloco>

      <Bloco titulo="Listas" nota="Linhas num contêiner branco de raio 16 com hairline recuada. A linha do usuário em roxo 6%; estados em chip neutro com o estado escrito.">
        <Demo>
          <div className="flex flex-col gap-5">
            <ListaGrupo titulo="Goleiros">
              <LinhaLista
                altura="alta"
                inicio={<AvatarJogador iniciais="M" />}
                titulo="Marcão"
                meta={<>Goleiro fixo · ELO <Num>1342</Num></>}
                fim={<ChipEstado ponto="confirmado">Confirmado</ChipEstado>}
              />
              <LinhaLista
                altura="alta"
                inicio={<AvatarJogador iniciais="J" tom="claro" />}
                titulo="Juninho"
                meta={<>Goleiro fixo · ELO <Num>1198</Num></>}
                fim={<ChipEstado ponto="confirmado">Confirmado</ChipEstado>}
              />
            </ListaGrupo>
            <ListaGrupo titulo="Linha">
              <LinhaLista
                altura="alta"
                eu
                inicio={<AvatarJogador iniciais="RF" />}
                titulo="Rodrigo Ferraz"
                meta={<>Você · ELO <Num>1287</Num></>}
                fim={<ChipEstado icone={icone("sem-resposta")}>Sem resposta</ChipEstado>}
              />
              <LinhaLista
                altura="alta"
                inicio={<AvatarJogador iniciais="I" />}
                titulo="Igor"
                meta={<>ELO <Num>1098</Num></>}
                fim={<ChipEstado icone={icone("fila")}><Num className="font-bold">1º</Num> na fila</ChipEstado>}
              />
              <LinhaLista
                altura="alta"
                inicio={<AvatarJogador iniciais="L" />}
                titulo="Lucão"
                meta={<>ELO <Num>1211</Num></>}
                fim={<ChipEstado icone={icone("lesionado")}>Lesionado</ChipEstado>}
              />
              <LinhaLista
                altura="alta"
                inicio={<AvatarJogador iniciais="BS" />}
                titulo="Bruno Sapo"
                meta={<>ELO <Num>1063</Num></>}
                fim={<ChipEstado ponto="ausente">Não vai</ChipEstado>}
              />
            </ListaGrupo>
          </div>
          <div className="flex flex-col gap-5">
            <ListaGrupo titulo="Classificação">
              {CLASSIFICACAO.map((t) => (
                <LinhaLista
                  key={t.nome}
                  inicio={
                    <span className="flex items-center gap-2">
                      <span className="flex w-8 items-center gap-1">
                        <Num className={cn("text-base", t.pos === 1 ? "font-bold text-foreground" : "text-muted-foreground")}>{t.pos}</Num>
                        {t.pos === 1 ? <Icon path={icone("campeao")} title="1º lugar" className="size-4 text-ouro" /> : null}
                      </span>
                      <Colete cor={t.cor} />
                    </span>
                  }
                  titulo={t.nome}
                  meta={
                    <>
                      <Num>{t.j}</Num> J · <Num>{t.v}</Num> V · <Num>{t.e}</Num> E · <Num>{t.d}</Num> D · saldo <Num>{t.sg}</Num>
                    </>
                  }
                  fim={
                    <span className="flex items-baseline gap-1">
                      <Num className="text-lg font-bold text-foreground">{t.p}</Num>
                      <span className="text-xs font-medium text-muted-foreground">pts</span>
                    </span>
                  }
                />
              ))}
            </ListaGrupo>
            <ListaGrupo titulo="Grupo" acao={<a href="#padroes-de-tela">Editar</a>}>
              <LinhaLista inicio={<Icon path={icone("temporada")} className="size-5 text-ink" />} titulo="Temporada 2026" fim={<Num className="text-muted-foreground">18 jogos</Num>} chevron onClick={() => {}} />
              <LinhaLista inicio={<Icon path={icone("grupo")} className="size-5 text-ink" />} titulo="Jogadores" fim={<Num className="text-muted-foreground">19</Num>} chevron onClick={() => {}} />
              <LinhaLista inicio={<Icon path={icone("convite")} className="size-5 text-ink" />} titulo="Convidar para o grupo" chevron href="#padroes-de-tela" />
            </ListaGrupo>
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Painel do operador" nota="Na aba Marcar: um painel por time, goleiro primeiro, linhas de toque de 48 px. Embaixo, as ações secundárias e o encerrar em rosa-tinta.">
        <Demo>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <PainelTime cor="vermelho" nome="Vermelho" gols={1}>
                {ESCALACAO.vermelho.slice(0, 3).map((j) => (
                  <LinhaJogador key={j.id} nome={j.nome} iniciais={j.iniciais} tom={j.tom} goleiro={j.goleiro} gols={GOLS_INICIAIS[j.id]} onMarcar={() => {}} />
                ))}
              </PainelTime>
              <PainelTime cor="amarelo" nome="Amarelo" gols={2}>
                {ESCALACAO.amarelo.slice(0, 3).map((j) => (
                  <LinhaJogador key={j.id} nome={j.nome} iniciais={j.iniciais} tom={j.tom} goleiro={j.goleiro} gols={GOLS_INICIAIS[j.id]} onMarcar={() => {}} />
                ))}
              </PainelTime>
            </div>
            <AcoesOperador onGolContra={() => {}} onPenalti={() => {}} onDesfazer={() => {}} onEncerrar={() => {}} />
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Estatística e gráficos" nota="Chart.js só em roxo: linha de 2,5 px com área de 18% a 0, último ponto destacado, tier em tracejado, sem legenda com uma série. As cores vêm dos tokens e acompanham o tema.">
        <Demo>
          <div className="flex flex-col gap-4 rounded-xl bg-surface p-4">
            <GrupoEstatisticas>
              <Estatistica valor="31" rotulo="pts" />
              <Estatistica valor="57%" rotulo="aproveit." />
              <Estatistica valor="12" rotulo="gols" />
              <Estatistica valor="7" rotulo="assist." />
            </GrupoEstatisticas>
            <GraficoLinha
              rotulos={ELO_ROTULOS}
              valores={ELO_VALORES}
              min={1180}
              max={1300}
              passo={40}
              referencias={[{ valor: 1250, rotulo: "Ouro" }]}
              rotuloAcessivel="Evolução do ELO nas últimas 10 sessões, de 1198 a 1287"
            />
            <GraficoBarras
              rotulos={["06/10", "13/10", "20/10", "27/10", "03/11"]}
              series={[{ rotulo: "Gols", valores: [2, 0, 3, 1, 2] }]}
              altura={140}
              rotuloAcessivel="Gols por sessão nas últimas 5 sessões: 2, 0, 3, 1 e 2"
            />
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Login" nota="Fundo de tela cheia com o impulso a 6% e o convite em branco 8%. É o único lugar com campo translúcido.">
        <div className="max-w-[390px]">
          <Login />
        </div>
      </Bloco>
    </Section>
  )
}
