import { Section, Block, Demo, Code, Never } from "./_shared"
import nightChampion from "@meujogo/brand/emblemas/emblema-campeao-da-noite-320.webp"
import topScorer from "@meujogo/brand/emblemas/emblema-artilheiro-320.webp"
import topAssister from "@meujogo/brand/emblemas/emblema-garcom-320.webp"
import topKeeper from "@meujogo/brand/emblemas/emblema-paredao-320.webp"
import unbeaten from "@meujogo/brand/emblemas/emblema-invicto-320.webp"
import onTheRise from "@meujogo/brand/emblemas/emblema-em-alta-320.webp"
import seasonChampion from "@meujogo/brand/emblemas/emblema-campeao-da-temporada-320.webp"
import legend from "@meujogo/brand/emblemas/emblema-lenda-320.webp"
import nightChampionSmall from "@meujogo/brand/emblemas/emblema-campeao-da-noite-pequeno-96.webp"
import topScorerSmall from "@meujogo/brand/emblemas/emblema-artilheiro-pequeno-96.webp"
import topAssisterSmall from "@meujogo/brand/emblemas/emblema-garcom-pequeno-96.webp"
import championCard from "@meujogo/brand/emblemas/carta-campeao-da-noite-480.webp"
import topScorerCard from "@meujogo/brand/emblemas/carta-artilheiro-480.webp"

type Emblem = { name: string; src: string; feat: string; material: string }

const NIGHT: Emblem[] = [
  { name: "Campeão da noite", src: nightChampion, feat: "o 1º da sessão (RN-102)", material: "folha ouro" },
  { name: "Artilheiro da noite", src: topScorer, feat: "gols do dia (RN-104)", material: "folha rosa" },
  { name: "Garçom da noite", src: topAssister, feat: "assistências (RN-065)", material: "folha ciano" },
  { name: "Paredão da noite", src: topKeeper, feat: "gols sofridos e pênaltis defendidos", material: "folha ciano" },
  { name: "Invicto", src: unbeaten, feat: "sessões seguidas sem perder", material: "folha rosa" },
  { name: "ELO em alta", src: onTheRise, feat: "maior ganho de ELO da noite", material: "folha ciano" },
]

const SEASON: Emblem[] = [
  { name: "Campeão da temporada", src: seasonChampion, feat: "o 1º do ranking ao fechar (UC-26)", material: "cristal dourado" },
  { name: "Lenda", src: legend, feat: "quem acumula títulos no Hall da Fama", material: "marfim e ouro" },
]

function Caption({ e }: { e: Emblem }) {
  return (
    <figcaption className="flex flex-col gap-0.5 text-sm">
      <span className="font-semibold text-ink">{e.name}</span>
      <span className="text-fg-2">{e.feat}</span>
      <span className="font-num text-xs tracking-[0.08em] text-muted-foreground uppercase">{e.material}</span>
    </figcaption>
  )
}

export function Emblems() {
  return (
    <Section
      id="emblems"
      n="07 · Emblemas"
      title="A placa dos títulos."
      lead={
        <>
          Cada título que um jogador ganha vira um emblema: uma placa só, com a matéria gerada no Gemini (a folha de cristal em ouro, rosa ou ciano para a noite, o cristal dourado para a temporada, o marfim com ouro para a Lenda), o número do feito em Rajdhani com o ícone pequeno em cima, o nome do título e o Jogador na ponta. A cor diz a família: ouro para título, rosa para gol e sequência, ciano para dado. A mesma placa com o rosto do jogador numa moldura redonda é a <strong className="text-ink">carta do título</strong>: o card dinâmico do dashboard e a imagem que vai para o WhatsApp. Kit em <Code>marca/emblemas/</Code>, composto por <Code>compor_emblemas.py</Code>.
        </>
      }
    >
      <Block title="Os destaques da noite" note="Seis títulos por sessão. O número é o feito da noite; a segunda linha, a unidade.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {NIGHT.map((e) => (
            <figure key={e.name} className="flex min-w-0 flex-col gap-3">
              <img src={e.src} alt={e.name} className="w-full" />
              <Caption e={e} />
            </figure>
          ))}
        </div>
      </Block>

      <Block title="Temporada e Lenda" note="As duas matérias raras: o cristal dourado fecha a temporada; o marfim com ouro é de quem acumula títulos. O corte da Lenda fica em configuração.">
        <Demo>
          <div className="flex flex-wrap items-end gap-8">
            {SEASON.map((e) => (
              <figure key={e.name} className="flex items-end gap-5">
                <img src={e.src} alt={e.name} className="h-56 w-auto" />
                <div className="pb-3">
                  <Caption e={e} />
                </div>
              </figure>
            ))}
          </div>
        </Demo>
      </Block>

      <Block
        title="A carta do título"
        note="O número em cima, o rosto do jogador numa moldura redonda no meio e o ícone do título como selo na borda dela; o nome e o título embaixo. A moldura recebe a foto de perfil como está, sem recorte de fundo, por isso a carta é o card dinâmico do dashboard; a mesma carta vai para o WhatsApp e o story. O emblema não leva rosto; a carta leva."
      >
        <Demo>
          <div className="flex flex-wrap items-end gap-6">
            <img src={championCard} alt="Carta do título: Rodrigo, campeão da noite" className="h-72 w-auto" />
            <img src={topScorerCard} alt="Carta do título: Rodrigo, artilheiro com 7 gols" className="h-72 w-auto" />
          </div>
        </Demo>
      </Block>

      <Block title="Escala e corte pequeno" note="Com rótulo a partir de 64 px. Abaixo disso entra o corte pequeno: só o número, maior, sem palavra nem símbolo.">
        <Demo>
          <div className="flex flex-wrap items-end gap-4">
            {[
              [nightChampion, "h-40", "160"],
              [nightChampion, "h-24", "96"],
              [nightChampion, "h-16", "64"],
              [nightChampionSmall, "h-12", "48 · pequeno"],
              [topScorerSmall, "h-8", "32 · pequeno"],
              [topAssisterSmall, "h-6", "24 · pequeno"],
            ].map(([src, h, label]) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <img src={src} alt="" className={h + " w-auto"} />
                <span className="font-num text-[11px] whitespace-nowrap text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Demo>
      </Block>

      <Block title="Regras">
        <div className="grid gap-6 md:grid-cols-2">
          <ul className="flex flex-col gap-2 text-sm leading-snug text-fg-2">
            <li>Um emblema por título, nunca por estatística solta: ele marca quem ganhou alguma coisa na noite, na temporada ou no Hall da Fama.</li>
            <li>O número dentro da placa é o feito (gols, assistências, noites, ELO ganho, 1º); a unidade vai na segunda linha, em Rajdhani.</li>
            <li>A cor dominante segue a família do fato: ouro para título, rosa para gol e sequência, ciano para dado.</li>
            <li>Perfil e ranking usam o emblema; dashboard, WhatsApp e story usam a carta do título, com o rosto na moldura redonda e o nome.</li>
            <li>Na carta, a moldura redonda recebe a foto de perfil como está, recortada ao quadrado pelo centro: o app não recorta fundo.</li>
            <li>A matéria vem do Gemini a partir do emblema-mestre, por edição; a tinta, a tipografia e as posições vêm do compositor.</li>
          </ul>
          <ul className="flex flex-col gap-2">
            <Never>Não pôr ícone grande no centro: o centro é o número; o ícone é pequeno e fica em cima dele.</Never>
            <Never>Não pôr rosto, nome de jogador ou emblema do grupo no emblema: isso é a carta.</Never>
            <Never>Não pôr o número no canto da carta: ele some atrás do ombro da placa. Fica em cima, centrado; o ícone vira selo na moldura.</Never>
            <Never>Não criar outra silhueta nem outra matéria fora destas cinco (ouro, rosa, ciano, cristal dourado, marfim).</Never>
            <Never>Não usar a folha como fundo de tela ou de card; ela só existe dentro da placa.</Never>
          </ul>
        </div>
      </Block>
    </Section>
  )
}
