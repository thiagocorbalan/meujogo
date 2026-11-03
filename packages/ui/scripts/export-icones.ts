import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { ICONES } from "../src/icones.ts"

const out = resolve(process.argv[2] ?? resolve(import.meta.dirname, "../dist/icones"))
mkdirSync(out, { recursive: true })

for (const i of ICONES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><title>${i.nome}</title><path d="${i.path}"/></svg>\n`
  writeFileSync(resolve(out, `icone-${i.nome}.svg`), svg)
}

const mapa = ICONES.map(({ nome, mdi, familia, uso, provisorio }) => ({ nome, mdi, familia, uso, ...(provisorio ? { provisorio } : {}) }))
writeFileSync(resolve(out, "mapa.json"), JSON.stringify(mapa, null, 2) + "\n")
console.log(`${ICONES.length} ícones em ${out}`)
