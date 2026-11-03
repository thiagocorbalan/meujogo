import { Section, Bloco, Demo, Code, Nunca } from "./_shared"
import campeaoDaNoite from "@meujogo/brand/emblemas/emblema-campeao-da-noite-320.webp"
import artilheiro from "@meujogo/brand/emblemas/emblema-artilheiro-320.webp"
import garcom from "@meujogo/brand/emblemas/emblema-garcom-320.webp"
import paredao from "@meujogo/brand/emblemas/emblema-paredao-320.webp"
import invicto from "@meujogo/brand/emblemas/emblema-invicto-320.webp"
import emAlta from "@meujogo/brand/emblemas/emblema-em-alta-320.webp"
import campeaoDaTemporada from "@meujogo/brand/emblemas/emblema-campeao-da-temporada-320.webp"
import lenda from "@meujogo/brand/emblemas/emblema-lenda-320.webp"
import campeaoPequeno from "@meujogo/brand/emblemas/emblema-campeao-da-noite-pequeno-96.webp"
import artilheiroPequeno from "@meujogo/brand/emblemas/emblema-artilheiro-pequeno-96.webp"
import garcomPequeno from "@meujogo/brand/emblemas/emblema-garcom-pequeno-96.webp"
import cartaCampeao from "@meujogo/brand/emblemas/carta-campeao-da-noite-480.webp"
import cartaArtilheiro from "@meujogo/brand/emblemas/carta-artilheiro-480.webp"

type Emblema = { nome: string; src: string; fato: string; materia: string }

const NOITE: Emblema[] = [
  { nome: "Campeão da noite", src: campeaoDaNoite, fato: "o 1º da sessão (RN-102)", materia: "folha ouro" },
  { nome: "Artilheiro da noite", src: artilheiro, fato: "gols do dia (RN-104)", materia: "folha rosa" },
  { nome: "Garçom da noite", src: garcom, fato: "assistências (RN-065)", materia: "folha ciano" },
  { nome: "Paredão da noite", src: paredao, fato: "gols sofridos e pênaltis defendidos", materia: "folha ciano" },
  { nome: "Invicto", src: invicto, fato: "sessões seguidas sem perder", materia: "folha rosa" },
  { nome: "ELO em alta", src: emAlta, fato: "maior ganho de ELO da noite", materia: "folha ciano" },
]

const TEMPORADA: Emblema[] = [
  { nome: "Campeão da temporada", src: campeaoDaTemporada, fato: "o 1º do ranking ao fechar (UC-26)", materia: "cristal dourado" },
  { nome: "Lenda", src: lenda, fato: "quem acumula títulos no Hall da Fama", materia: "marfim e ouro" },
]

function Legenda({ e }: { e: Emblema }) {
  return (
    <figcaption className="flex flex-col gap-0.5 text-sm">
      <span className="font-semibold text-ink">{e.nome}</span>
      <span className="text-fg-2">{e.fato}</span>
      <span className="font-num text-xs tracking-[0.08em] text-muted-foreground uppercase">{e.materia}</span>
    </figcaption>
  )
}

export function Emblemas() {
  return (
    <Section
      id="emblemas"
      n="07 · Emblemas"
      titulo="A placa dos títulos."
      lead={
        <>
          Cada título que um jogador ganha vira um emblema: uma placa só, com a matéria gerada no Gemini (a folha de cristal em ouro, rosa ou ciano para a noite, o cristal dourado para a temporada, o marfim com ouro para a Lenda), o número do feito em Rajdhani com o ícone pequeno em cima, o nome do título e o Jogador na ponta. A cor diz a família: ouro para título, rosa para gol e sequência, ciano para dado. A mesma placa com o rosto do jogador numa moldura redonda é a <strong className="text-ink">carta do título</strong>: o card dinâmico do dashboard e a imagem que vai para o WhatsApp. Kit em <Code>marca/emblemas/</Code>, composto por <Code>compor_emblemas.py</Code>.
        </>
      }
    >
      <Bloco titulo="Os destaques da noite" nota="Seis títulos por sessão. O número é o feito da noite; a segunda linha, a unidade.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {NOITE.map((e) => (
            <figure key={e.nome} className="flex min-w-0 flex-col gap-3">
              <img src={e.src} alt={e.nome} className="w-full" />
              <Legenda e={e} />
            </figure>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Temporada e Lenda" nota="As duas matérias raras: o cristal dourado fecha a temporada; o marfim com ouro é de quem acumula títulos. O corte da Lenda fica em configuração.">
        <Demo>
          <div className="flex flex-wrap items-end gap-8">
            {TEMPORADA.map((e) => (
              <figure key={e.nome} className="flex items-end gap-5">
                <img src={e.src} alt={e.nome} className="h-56 w-auto" />
                <div className="pb-3">
                  <Legenda e={e} />
                </div>
              </figure>
            ))}
          </div>
        </Demo>
      </Bloco>

      <Bloco
        titulo="A carta do título"
        nota="O número em cima, o rosto do jogador numa moldura redonda no meio e o ícone do título como selo na borda dela; o nome e o título embaixo. A moldura recebe a foto de perfil como está, sem recorte de fundo, por isso a carta é o card dinâmico do dashboard; a mesma carta vai para o WhatsApp e o story. O emblema não leva rosto; a carta leva."
      >
        <Demo>
          <div className="flex flex-wrap items-end gap-6">
            <img src={cartaCampeao} alt="Carta do título: Rodrigo, campeão da noite" className="h-72 w-auto" />
            <img src={cartaArtilheiro} alt="Carta do título: Rodrigo, artilheiro com 7 gols" className="h-72 w-auto" />
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Escala e corte pequeno" nota="Com rótulo a partir de 64 px. Abaixo disso entra o corte pequeno: só o número, maior, sem palavra nem símbolo.">
        <Demo>
          <div className="flex flex-wrap items-end gap-4">
            {[
              [campeaoDaNoite, "h-40", "160"],
              [campeaoDaNoite, "h-24", "96"],
              [campeaoDaNoite, "h-16", "64"],
              [campeaoPequeno, "h-12", "48 · pequeno"],
              [artilheiroPequeno, "h-8", "32 · pequeno"],
              [garcomPequeno, "h-6", "24 · pequeno"],
            ].map(([src, h, label]) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <img src={src} alt="" className={h + " w-auto"} />
                <span className="font-num text-[11px] whitespace-nowrap text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Demo>
      </Bloco>

      <Bloco titulo="Regras">
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
            <Nunca>Não pôr ícone grande no centro: o centro é o número; o ícone é pequeno e fica em cima dele.</Nunca>
            <Nunca>Não pôr rosto, nome de jogador ou emblema do grupo no emblema: isso é a carta.</Nunca>
            <Nunca>Não pôr o número no canto da carta: ele some atrás do ombro da placa. Fica em cima, centrado; o ícone vira selo na moldura.</Nunca>
            <Nunca>Não criar outra silhueta nem outra matéria fora destas cinco (ouro, rosa, ciano, cristal dourado, marfim).</Nunca>
            <Nunca>Não usar a folha como fundo de tela ou de card; ela só existe dentro da placa.</Nunca>
          </ul>
        </div>
      </Bloco>
    </Section>
  )
}
