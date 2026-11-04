import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { ICONS } from "../src/icons.ts"

const out = resolve(process.argv[2] ?? resolve(import.meta.dirname, "../dist/icons"))
mkdirSync(out, { recursive: true })

for (const i of ICONS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><title>${i.name}</title><path d="${i.path}"/></svg>\n`
  writeFileSync(resolve(out, `icon-${i.name}.svg`), svg)
}

const map = ICONS.map(({ name, mdi, family, usage }) => ({ name, mdi, family, usage }))
writeFileSync(resolve(out, "mapa.json"), JSON.stringify(map, null, 2) + "\n")
console.log(`${ICONS.length} icons in ${out}`)
