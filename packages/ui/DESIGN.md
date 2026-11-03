# Meu Jogo — Design System

App brasileiro que organiza a pelada semanal: presença, sorteio equilibrado por ELO, partida ao vivo e ranking com cartas por tier. Premium e profissional na forma, voz de amigo organizado. Mobile first: a pelada é organizada no celular; o desktop é o painel do organizador.

Referência completa: os componentes deste pacote (`src/components/ui/` e `src/components/mj/`), a vitrine em `apps/styleguide` e `doc/meujogo/marca/` (identidade-visual, sistema-de-identidade, design-tokens, styleguide). Telas validadas: `~/Documents/Clientes/MeuJogo/marca/telas/v3/`.

## The one rule: purple leads, the screen stays clean

Every app screen is about 80% neutral (white surfaces on a near-white page), 15–20% purple `#2E0B57`, and at most 5% vivid color. Purple marks what matters: the single hero block, the primary action, the selected tab, chip or date, the active nav item, section titles and links. Vivid colors (gold, cyan, pink, green) are rare signals with one fixed job each, never decoration, never large backgrounds. Content (player photos, group crests, vest colors) is where color variety comes from, not the UI.

Budget per screen (the live red badge counts as one): at most 2 distinct vivid colors, at most 1 per block, always as a small solid (dot, chip, icon, ring, one number) or ink-colored text. Celebration and share images (emblems, champion story, WhatsApp card) are the only places where gold or pink may go full-bleed; they are images, not app UI.

## Brand

- Name: Meu Jogo (never "MatchSoccer").
- Logo: the symbol "O Jogador" (player silhouette, arms open, ball at the foot). Only two versions exist: the principal lockup, "Meu" + symbol + "Jogo" on one line, and the symbol alone. Use the SVG files in `marca/logo/`; never type the name in a font, never draw the silhouette.
- One ink: the logo is purple `#2E0B57` on white/neutral, or white on the purple hero. Never with outline, shadow or gradient.
- Where it goes: the principal lockup in purple on the Login (about 48–56 px tall) and in the white top bar of the Dashboard (28–32 px tall); the symbol in purple, 28–32 px, on the left of the top bar of inner screens. In generated mockups the logo is a placeholder: an empty rectangle labeled "LOGO MEU JOGO" (lockup, about 2.7:1) or an empty square labeled "SÍMBOLO", nothing drawn inside.
- Clear space: the ball's diameter on all sides. Minimum heights: principal 28 px, symbol 24 px.

## Colors

### Purple and its tints (the lead)
- Purple `#2E0B57`: hero block, primary button, selected tab/chip/date, active nav icon and label, section titles, links, avatar initials background.
- Hover/pressed purple `#4A1E85`.
- Purple tints over white are allowed and preferred to new hues: 6% `#F4F1F7` for the "me" row, selected row and hover; 10% `#EAE6EF` for unselected chips, secondary buttons and progress tracks; inside the purple hero, white at 12% for inner tiles and pills.

### Neutrals (purple-biased; light / dark)
- Background `#F6F4F8` / `#14101A` · Surface `#FFFFFF` / `#1F1829` · Surface 2 `#F3F1F5` / `#2A2136` · Line `#D9D3E0` / `#342A40` · Foreground `#1C1426` / `#EFEAF4` · Foreground 2 `#4A3F57` / `#C9BFD4` · Muted `#6B6076` / `#A79CB3`.

### Vivid signals (one job each)
- Gold `#FFD700` (ink on white `#7A5C00`): first place, victory, champion of the night, the gold tier. A crown icon, a 1st-place dot, a gold ring on the champion's avatar, the title card. Never on navigation, menus, generic buttons or alerts.
- Cyan `#22D3EE` (ink `#0E7490`): the focus ring only. ELO and statistics are purple or neutral, not cyan.
- Live red `#DC2233`: the "Ao vivo" badge only — a solid red pill, white text Manrope 700 12, a white dot that pulses. It is the one place this red exists, plus an 8 px dot marking the live row in a fixtures list; it is not the error color.
- Pink `#FF3D8A` (ink `#C4175F`): error and destructive only. Inside the app it is never celebration.
- Green `#18DC60` (ink `#0B7A36`): success and confirmed attendance only, as an icon or a small dot. Never a fill bigger than a chip.
- Status chips, alerts and toasts sit on a neutral surface with an ink-colored icon and text; the vivid color only in the icon or dot. Never distinguish two states by color alone: the state is always written.

### Vest colors (content, not UI)
- Teams are named by their vest (Time Amarelo, Time Vermelho, Time Preto). Show the vest as the MDI `tshirt-crew` icon (16–20 px in lists and tables, 48–56 px in the score) next to the name, in the real vest color (amarelo `#F2C200`, vermelho `#D93636`, preto `#1C1426`, azul `#2F6FD6`, branco white with a line ring). The vest yellow is never a fill and is never confused with the brand gold; filled gold stays for the champion only.

### Card tiers (only on the player card and profile, not on every list row)
- Bronze `#C8803C` · Silver `#C9C5D1` · Gold `#FFD700` · Diamond `#22D3EE`; the tier name is always written.

## Typography

- Lexend for titles, Manrope for text and labels, Rajdhani for every number. No other family. At most two weights per family on a screen.
- Mobile scale (px): hero score Rajdhani 700 56 (live match 64) · hero key number Rajdhani 700 48 · clock/time in the hero Rajdhani 600 20 · stat number Rajdhani 700 28 · screen title Lexend 600 22 · section title Lexend 600 16 purple · card/row title Manrope 700 15–16 · body Manrope 400 16 · meta Manrope 500 14 muted · label/chip Manrope 600 12 · nav label Manrope 600 11 · table numbers Rajdhani 600 16 tabular, right-aligned.
- Sentence case everywhere. No uppercase titles, no tracked eyebrows, no 80 px poster type. The contrast between one big number and everything else at 16 px or below is what makes the screen clean.

## Spacing, radius, elevation

- Spacing base 4 px. Page gutter 16. 24 between sections, 12 between cards. Card padding 16, hero padding 20–24. List rows 56 px (64 with an avatar). Touch target 44 × 44.
- Radius: chips, tabs and buttons full (pill); inputs and nested blocks 12; cards 16; hero and bottom sheets 20; dialog 20.
- Elevation by tone only: white surface on the `#F6F4F8` page. No shadows except the dialog and a sticky bottom CTA. No glow, no glass, no blur (the login's translucent fields are the exception).
- Login: full-screen dark purple gradient (`#1A0633` to `#2E0B57`) with a soft radial glow at the top and the impulso pattern at about 6%; the white lockup; an invite card in white 8%; "Entrar com Google" as a white pill; e-mail field as a white 8% pill with white text; "Receber código" as a white-outline pill (1.5 px white 70%, white text), secondary to the Google pill. Lavender `#C9B6EE` is the action color inside the dark snackbar.

## Layout patterns

- **One hero per screen.** A purple block (radius 20, padding 20–24) that holds the screen's single key number: the score, the next game time, the attendance count, the player's ELO. Its fill is the hero gradient `linear-gradient(135deg, #2E0B57 0%, #5B2A9E 100%)` with one brand pattern (`marca/padroes/`: impulso on the live score, the next game and attendance; ritmo on the session table) at 8–12% opacity bleeding from one corner. White text; at most one gold value in it (only if it is a first place or victory). At most one CTA inside it: a full-width white pill with purple text. The one exception is an answer pair ("Vou jogar" / "Não vou"): the white pill plus a white-outline pill side by side, 1:2 wide. The gradient and the pattern live only in heroes and the login background, never on buttons, cards, the page or text. No giant faded icons, no blurred discs.
- **Lists are rows, not cards.** Homogeneous sets (attendance, standings, fixtures, match events, players) are plain rows inside one white container (radius 16), separated by inset hairlines in the line color. Never one card per row, never colored stripes on rows.
- **Cards** only for one discrete object you act on: the next game, a player summary, the title card.
- **Selection** is a filled purple pill; unselected chips are white or purple 10% with purple text. Date strips and segmented tabs follow the same rule.
- **Headers — three types, nothing else:**
  - *Root* (the five tabs): row 1, 56 px white — on the left the group switcher (symbol 28 px + group name Lexend 600 16 purple + chevron-down; on Início the principal lockup 24–28 px replaces the symbol), on the right the bell (outline, with a purple count badge in Rajdhani) and the 32 px avatar. Row 2: the large title Lexend 600 26 with a Manrope 14 muted meta line. On scroll the large title collapses and row 1 gains a hairline.
  - *Detail* (pushed screens): 56 px white — a 40 px round back button on `#EAE6EF` with a purple arrow, the title centered in Lexend 600 17 with an optional Manrope 12 muted subtitle, and one 40 px round action on the right (share or kebab). No symbol.
  - *Immersive* (live match, and later the session summary): the header sits inside a full-width purple block (hero gradient + pattern) that runs edge to edge from the status bar down to the content; back and kebab are 40 px circles in white 14% with white icons, the title is white and centered with a white 70% subtitle. The content below is a white sheet with 24 px top corners overlapping the purple by 24 px.
- **Bottom nav**: white, docked, hairline on top, 4–5 items (Início, Jogo, Ranking, Grupo, Perfil). Active item: filled MDI icon in purple with a purple 10% pill behind it and the label in purple; inactive: outline icon and label in muted. No gold.
- **Buttons**: primary purple pill 48 px, Manrope 700 16, white text, no shadow; secondary purple 10% pill with purple text; ghost and link in purple. Only one primary button per screen. Destructive is a pink-ink text button, confirmed in a dialog.
- **Inputs**: surface 2 fill, no border, radius 12, 52 px, leading icon in muted, label above in Manrope 600 14; focus = 2 px cyan ring; error = pink-ink message below with an icon. The 6-digit e-mail code is six 48 × 56 filled boxes in Rajdhani 24.
- **Stats**: rows with a centered label, the two values at the edges in Rajdhani and two thin bars (purple and purple 30%); or a 2-column tile grid on white with Rajdhani 28 numbers. Bars are purple, never multicolor.

## Iconography

- Material Design Icons (Pictogrammers), one icon per function, in currentColor. The map function → MDI name is in `marca/icones/mapa.json`. Filled for active/selected, outline for inactive.
- Sizes 16, 20 (buttons), 24 (nav). Never draw custom icons or mix another library. Yellow and red card glyphs are the only icons that keep their real color.

## Components (shadcn/ui, Base UI, Tailwind 4)

- Badge: neutral surface-2 chip, 24 px, Manrope 600 12, sentence case, with an optional 8 px status dot (green confirmed, pink absent; pending, queue, injured and goalkeeper have no vivid color, just an icon and text). The "Ao vivo" badge is the exception: a solid live-red pill with white text and a white dot (see Colors).
- Ranking table: plain rows, header Manrope 600 12 muted on white, position in Rajdhani 600, numbers right-aligned, the user's row on purple 6%, the 1st place with a small gold crown or dot, nothing else colored.
- Tabs: segmented pills or a 2 px purple underline under the active tab label.
- Dialog and bottom sheet: surface, radius 20, the only strong shadow.
- Toast and alert: surface with an ink icon and text; never a vivid background.
- Avatar: 32, 40, 56 px; photo, else initials in Lexend 600 white on purple (in mockups, a neutral `#D9D3E0` (line token) circle with purple initials stands for a photo); gold ring only for the champion of the night.
- Empty state: faded symbol placeholder at 64 px, Lexend title, short text, one action.
- Score: the full-width immersive block with the impulso pattern; each team is a vest icon (MDI `tshirt-crew`, 48–56 px) in the vest color on a white 12% circle, name 14 below; score Rajdhani 64 in white; the running clock in a solid white pill with purple Rajdhani 32 right under the score (the most visible thing after the score), a 36 px white pause/play button attached to it, and a thin white progress track; paused state reads "Pausado" and the track stops; the red "Ao vivo" badge at the top of the hero; scorers' minutes in 12 px under each team. Events live in their own tab (Linha do tempo) as plain rows: minute in Rajdhani, a small purple icon, player name.
- Live match, operator view (admin/moderator): tabs Marcar · Linha do tempo · Tabela. "Marcar" shows one panel per team (vest icon + name), the goalkeeper of that side first with the meta "goleiro" under the name, then the field players as 48 px tap rows (avatar + name); a tap is a goal for that player (a goalkeeper's goal counts for the team on that side). Below, secondary pills "Gol contra", "Pênalti" and "Desfazer último", and a pink-ink text action "Encerrar partida". After each goal a dark snackbar (`#1C1426`, white text, radius 12) says "Gol de Dudu registrado" with a lavender "Desfazer" action for about 5 s. No bottom nav.
- Charts (Chart.js): purple line `#2E0B57` 2.5 px with an area fill fading from purple 18% to 0, the last point emphasized (6 px, white ring), a faint `#EEEAF2` grid, axis text Manrope 12 muted, numbers Rajdhani; series beyond the first use purple 45% and purple 15%; dashed hairlines for reference levels (tiers). Gold only for a record or first-place marker. No legend when one series; no multicolor charts.

## Patterns and emblems

- The four graphic patterns in `marca/padroes/` appear in full color only in share, story, cover and celebration images. Inside app screens they appear only as the white ~10% texture of a hero or of the login background (see Layout patterns).
- Eight titles become holographic emblems. The title card shows the player's photo in a round purple frame with the number on top and the icon as a seal. In the app they appear as images: the title card once on the Dashboard, small emblems in the profile's Hall of Fame. In mockups they are 4:5 placeholders labeled "EMBLEMA".

## Notes for new screens

- Use the exact hex values above. The purple tints listed are allowed; do not invent other hues.
- Brand images come from `@meujogo/brand` (the `Marca` component for the logo, `Padrao` for patterns). Player photos fall back to initials, group crests to circles. Never draw a logo, mascot or silhouette.
- Copy in Brazilian Portuguese with real-sounding names and messy numbers. Mobile screens 390 px wide.

## Motion

- Durations: fast 150 ms, normal 250 ms, slow 400 ms (score, draw reveal, ELO). Curves: out `cubic-bezier(0,0,.2,1)`, in `cubic-bezier(.4,0,1,1)`, in-out `cubic-bezier(.4,0,.2,1)`. No bounce. Buttons sink 1 px. The "AO VIVO" dot pulses; nothing else loops.

## Do and don't

- Do give each screen one purple hero and leave the rest white.
- Do mark selection with a filled purple pill and the active nav with purple.
- Do keep lists as rows with hairlines in one white container.
- Do let crests, photos and vest colors bring the color variety.
- Don't put gold on navigation, menus or buttons; don't use cyan for data; don't use pink for celebration in the app.
- Don't use colored stripes on cards, colored chips per state, vivid hero blocks, glass, blur discs, giant faded icons, or shadows for hierarchy; gradients and patterns only inside the purple heroes and the login background.
- Don't use uppercase titles, tracked eyebrows or poster-size type.
- Don't redraw the player silhouette, separate the ball, or type the wordmark.
