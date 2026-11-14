// Atrium Noon, tile edition (v2). Follows RULES.md.
// Elements kept from the reference: an overexposed white glass wall in panes (thin mullions, heavier transoms), black
// steel columns studded with rivets, a catwalk of beige plate with a glass railing, a staircase going down to the right,
// a patch of yellowed panes at the upper right, a dark beam at the right, and a soft burnt-out glow.
// Moved to keep the conversation column clear (x 440..1240 holds only a ghost of the grid): the noon light burns the
// middle of the catwalk away, so its left end stands in the left strip and the stairs start in the right strip.
// Medium: square tiles only, 20-unit cells on an 80 by 50 grid, every surface rasterised onto it; the light is tile tone.
// Motion: a band of light steps across the panes, single panes catch the sun, dust specks rise a cell at a time, and a
// sheet of paper tumbles down past the left column, one cell per step.
// No filters, no masks. Pure string building: the same output on every call.

const CELL = 20
const COLS = 80
const ROWS = 50
const W = COLS * CELL
const H = ROWS * CELL

// The column band the conversation sits over: nothing but a ghost of the grid here.
const CLEAR_FROM = 22
const CLEAR_TO = 62

const PAINT: Record<string, string> = {
  w0: '#f8f6ef',
  w1: '#f1efe6',
  w2: '#e8e5d9',
  w3: '#dedacb',
  c1: '#efe5c4',
  c2: '#e6d8ac',
  steel: '#1d1c18',
  steelEdge: '#3b382f',
  steelGlass: '#57544b',
  deck: '#d9cfb1',
  deckLight: '#ebe4cd',
  deckDark: '#b8ad8b',
  under: '#2b2923',
  glass: '#fbfaf4',
  rail: '#c6c2b3',
  post: '#b3af9f',
}

// Adapted from Anthropic's theme-examples plugin (Apache-2.0).
function hash(x: number, y: number, salt: number): number {
  let h = Math.imul(x + 11, 374761393) ^ Math.imul(y + 7, 668265263) ^ Math.imul(salt + 3, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return (h >>> 0) / 4294967296
}

const clear = (c: number) => c >= CLEAR_FROM && c < CLEAR_TO

// ---- The picture, one tile kind per cell --------------------------------------------------------------------

const STEEL_COLS = [14, 15, 66, 67, 77, 78]
const STAIR_FROM = 62
const DECK_ROW = 23
const stairRow = (c: number) => DECK_ROW + Math.floor((c - STAIR_FROM) * 0.72)

const PANE = 7

function wall(c: number, r: number): string {
  if (clear(c)) return 'w0'
  const pc = Math.floor(c / PANE)
  const pr = Math.floor(r / PANE)
  // Upper right: whole panes of yellowed glass, as in the reference.
  if (pc >= 9 && pr <= 2 && hash(pc, pr, 5) < 0.6) return hash(pc, pr, 6) < 0.4 ? 'c2' : 'c1'
  // Light is strongest high in the middle; panes further out sit a shade or two darker.
  const t = Math.hypot((pc * PANE + 3 - 40) / 40, (pr * PANE + 3 - 10) / 42) + (hash(pc, pr, 7) - 0.5) * 0.12
  return t < 0.62 ? 'w0' : t < 0.8 ? 'w1' : t < 0.95 ? 'w2' : 'w3'
}

function kindAt(c: number, r: number): string {
  if (clear(c)) return 'w0'
  let kind = wall(c, r)
  const steel = STEEL_COLS.includes(c)
  if (steel) kind = STEEL_COLS.indexOf(c) % 2 === 1 ? 'steelEdge' : 'steel'

  // The dark beam at the right, behind the stairs.
  if (c >= 70 && (r === 27 || r === 28)) kind = 'steel'

  // Catwalk, left strip: rail, glass, deck, underside.
  if (c < CLEAR_FROM) {
    if (r === 17) kind = 'rail'
    else if (r >= 18 && r <= 22) kind = c % 7 === 3 ? 'post' : steel ? 'steelGlass' : 'glass'
    else if (r === DECK_ROW) kind = 'deckLight'
    else if (r === DECK_ROW + 1) kind = 'deck'
    else if (r === DECK_ROW + 2) kind = 'under'
  }

  // Stairs, right strip: a landing, then treads stepping down to the right under a sloped glass rail.
  if (c >= STAIR_FROM) {
    const top = stairRow(c)
    if (r === top) kind = 'deckLight'
    else if (r === top + 1) kind = 'deck'
    else if (r === top + 2) kind = 'under'
    else if (r === top - 6) kind = 'rail'
    else if (r >= top - 5 && r <= top - 1 && !steel) kind = (c - STAIR_FROM) % 6 === 1 ? 'post' : 'glass'
  }
  return kind
}

/** Same-kind cells joined into rectangles: runs along a row, then equal runs stacked down. */
function blocks(cells: boolean[][]): string {
  type Rect = [number, number, number, number]
  const out: Rect[] = []
  let open = new Map<string, Rect>()
  for (let r = 0; r < ROWS; r += 1) {
    const next = new Map<string, Rect>()
    let c = 0
    while (c < COLS) {
      if (!cells[r]?.[c]) {
        c += 1
        continue
      }
      const s = c
      while (c < COLS && cells[r]?.[c]) c += 1
      const key = `${s},${c - s}`
      const rect = open.get(key)
      if (rect !== undefined) {
        rect[3] += 1
        next.set(key, rect)
      } else {
        const fresh: Rect = [s, r, c - s, 1]
        out.push(fresh)
        next.set(key, fresh)
      }
    }
    open = next
  }
  return out.map(([x, y, w, h]) => `M${x * CELL} ${y * CELL}h${w * CELL}v${h * CELL}h-${w * CELL}z`).join('')
}

function picture(): string {
  const byKind = new Map<string, boolean[][]>()
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const k = kindAt(c, r)
      if (k === 'w0') continue
      let grid = byKind.get(k)
      if (grid === undefined) {
        grid = Array.from({ length: ROWS }, () => new Array<boolean>(COLS).fill(false))
        byKind.set(k, grid)
      }
      const row = grid[r]
      if (row !== undefined) row[c] = true
    }
  }
  let out = ''
  for (const [k, grid] of byKind) out += `<path class="${k}" d="${blocks(grid)}"/>`
  return out
}

/** Rivets: a dot in each steel tile on the lit edge, and a pair on each deck plate. */
function rivets(): string {
  let d = ''
  for (const c of STEEL_COLS.filter((_, i) => i % 2 === 1)) {
    for (let r = 0; r < ROWS; r += 2) d += `M${c * CELL + 10} ${r * CELL + 10}m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`
  }
  for (let c = 1; c < CLEAR_FROM; c += 3) d += `M${c * CELL + 10} ${(DECK_ROW + 1) * CELL + 10}m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0`
  for (let c = STAIR_FROM + 1; c < COLS; c += 3) {
    const r = stairRow(c) + 1
    d += `M${c * CELL + 10} ${r * CELL + 10}m-1.8 0a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0`
  }
  return `<path class="rivet" d="${d}"/>`
}

/** The noon light eats the strips' inner edges: four tile columns on each side, each a step whiter. */
function burn(): string {
  let out = ''
  const steps = [0.2, 0.42, 0.66, 0.86]
  steps.forEach((o, i) => {
    out += `<rect x="${(CLEAR_FROM - 4 + i) * CELL}" y="0" width="${CELL}" height="${H}" class="w0" opacity="${o}"/>`
    out += `<rect x="${(CLEAR_TO + 3 - i) * CELL}" y="0" width="${CELL}" height="${H}" class="w0" opacity="${o}"/>`
  })
  return out
}

// ---- Motion ----

/** Some of the yellowed panes deepen a shade and back, in turn, as the light shifts. */
function shimmer(): string {
  let out = ''
  let i = 0
  for (let pc = 9; pc * PANE < COLS; pc += 1) {
    for (let pr = 0; pr <= 2; pr += 1) {
      if (hash(pc, pr, 5) >= 0.6) continue
      const x = Math.max(pc * PANE, CLEAR_TO + 4) * CELL
      const w = (pc + 1) * PANE * CELL - x
      if (w <= 0) continue
      out += `<rect class="shimmer" style="animation-delay:-${(i * 2.3).toFixed(1)}s" x="${x}" y="${pr * PANE * CELL}" width="${w}" height="${PANE * CELL}"/>`
      i += 1
    }
  }
  return out
}

/** A band of light: one strip per column outside the clear band, each lighting up a little after its neighbour. */
function sweep(): string {
  let out = ''
  for (let c = 0; c < COLS; c += 1) {
    if (clear(c)) continue
    out += `<rect class="sweep" style="animation-delay:${(c * 0.22).toFixed(2)}s" x="${c * CELL}" y="0" width="${CELL}" height="${H}"/>`
  }
  return out
}

/** Sun caught on the glass: a plus of five tiles, gold arms and a white heart, flashing on long staggered cycles. */
function glints(): string {
  const cells: Array<[number, number]> = [[4, 6], [11, 3], [18, 12], [6, 31], [17, 40], [69, 5], [75, 10], [72, 20], [68, 40], [75, 45]]
  return cells
    .map(([c, r], i) => {
      const t = (x: number, y: number, k: string) => `<rect class="${k}" x="${x * CELL + 1}" y="${y * CELL + 1}" width="18" height="18"/>`
      return (
        `<g class="glint" style="animation-delay:-${(i * 3.1).toFixed(1)}s">` +
        t(c - 1, r, 'arm') + t(c + 1, r, 'arm') + t(c, r - 1, 'arm') + t(c, r + 1, 'arm') + t(c, r, 'heart') +
        `</g>`
      )
    })
    .join('')
}

/** Dust: quarter-cell specks that rise one cell per step. */
function dust(): string {
  let out = ''
  for (let i = 0; i < 14; i += 1) {
    const left = i % 2 === 0
    const c = left ? 1 + Math.floor(hash(i, 1, 9) * 20) : 63 + Math.floor(hash(i, 1, 9) * 16)
    const r = 20 + Math.floor(hash(i, 2, 9) * 28)
    const dur = 18 + hash(i, 3, 9) * 16
    out += `<rect class="speck" style="animation-duration:${dur.toFixed(1)}s;animation-delay:-${(hash(i, 4, 9) * dur).toFixed(1)}s" x="${c * CELL + 7}" y="${r * CELL + 7}" width="6" height="6"/>`
  }
  return out
}

/** Sheets of paper tumbling down, one cell per step, flat then edge-on, a grey shadow tile under each. */
function sheet(col: number, seconds: number, delay: number): string {
  const x = col * CELL
  return (
    `<g class="fall" style="animation-duration:${seconds}s;animation-delay:-${delay}s"><g class="drift">` +
    `<rect class="paperShadow" x="${x + 7}" y="7" width="38" height="18"/>` +
    `<rect class="paperFlat" x="${x + 1}" y="1" width="38" height="18"/>` +
    `<rect class="paperEdge" x="${x + 11}" y="1" width="18" height="18"/>` +
    `</g></g>`
  )
}

const STYLE =
  Object.entries(PAINT).map(([k, v]) => `.${k}{fill:${v}}`).join('') +
  '.rivet{fill:#8c8676}' +
  '.burn{shape-rendering:auto}' +
  '.sweep{fill:#f0cf6e;opacity:0;animation:sweep 22s steps(1) infinite}' +
  '@keyframes sweep{0%{opacity:0}2%{opacity:.2}4%{opacity:.38}6%{opacity:.2}8%,100%{opacity:0}}' +
  '.glint{opacity:0;animation:glint 31s steps(1) infinite}.arm{fill:#efce6a}.heart{fill:#fffaf0;stroke:#e2b84a;stroke-width:2}' +
  '@keyframes glint{0%,90%{opacity:0}91%,94%{opacity:1}95%,96%{opacity:.45}97%,100%{opacity:0}}' +
  '.speck{fill:#a99d7c;animation-name:rise;animation-timing-function:steps(12);animation-iteration-count:infinite}' +
  `@keyframes rise{from{transform:translateY(0);opacity:.9}to{transform:translateY(-${12 * CELL}px);opacity:0}}` +
  '.fall{animation-name:fall;animation-timing-function:steps(54);animation-iteration-count:infinite}' +
  `@keyframes fall{from{transform:translateY(-${2 * CELL}px)}to{transform:translateY(${(ROWS + 2) * CELL}px)}}` +
  '.drift{animation:drift 3.6s steps(1) infinite}' +
  `@keyframes drift{0%{transform:translateX(0)}25%{transform:translateX(${CELL}px)}50%{transform:translateX(${2 * CELL}px)}75%{transform:translateX(${CELL}px)}}` +
  '.paperFlat,.paperEdge{fill:#fffdf6;stroke:#1d1c18;stroke-width:2;stroke-opacity:.85}.paperShadow{fill:#8c8676;opacity:.35;animation:flat 1.8s steps(1) infinite}' +
  '.paperFlat{animation:flat 1.8s steps(1) infinite}.paperEdge{animation:edge 1.8s steps(1) infinite}' +
  '@keyframes flat{0%{opacity:1}50%,100%{opacity:0}}@keyframes edge{0%{opacity:0}50%,100%{opacity:1}}' +
  '.shimmer{fill:#d9c48a;opacity:0;animation:shimmer 14s steps(1) infinite}' +
  '@keyframes shimmer{0%,60%{opacity:0}61%,72%{opacity:.3}73%,84%{opacity:.5}85%,100%{opacity:0}}' +
  '@media (prefers-reduced-motion: reduce){*{animation:none!important}.sweep,.glint,.speck,.fall,.shimmer{display:none}}'

let built: string | undefined

export function atriumNoonSvg(): string {
  if (built !== undefined) return built

  const defs =
    // Tile joints: a dark seam and a light lip on every cell. Strong in the strips, a ghost over the clear band.
    `<pattern id="joints" width="${CELL}" height="${CELL}" patternUnits="userSpaceOnUse">` +
    `<path d="M0 0.5h${CELL}M0.5 0v${CELL}" stroke="#000" stroke-opacity=".07" stroke-width="1" fill="none"/>` +
    `<path d="M1.5 1.5h${CELL - 2}M1.5 1.5v${CELL - 2}" stroke="#ffffff" stroke-opacity=".5" stroke-width="1" fill="none"/></pattern>` +
    `<pattern id="ghost" width="${CELL * 7}" height="${CELL * 7}" patternUnits="userSpaceOnUse">` +
    `<path d="M0 1h${CELL * 7}M1 0v${CELL * 7}" stroke="#ece9df" stroke-width="2" fill="none"/></pattern>` +
    // Heavier transoms every other row of panes, and a heavier mullion every fourth column.
    `<pattern id="frames" width="${CELL * PANE}" height="${CELL * PANE}" patternUnits="userSpaceOnUse">` +
    `<path d="M0 1.5h${CELL * PANE}M1.5 0v${CELL * PANE}" stroke="#a9a596" stroke-width="3" fill="none"/></pattern>` +
    `<linearGradient id="burnL" x1="0" x2="1"><stop offset="0" stop-color="${PAINT.w0}" stop-opacity="0"/><stop offset="1" stop-color="${PAINT.w0}" stop-opacity="1"/></linearGradient>` +
    `<linearGradient id="burnR" x1="1" x2="0"><stop offset="0" stop-color="${PAINT.w0}" stop-opacity="0"/><stop offset="1" stop-color="${PAINT.w0}" stop-opacity="1"/></linearGradient>`

  const strips = (pattern: string) =>
    `<rect x="0" y="0" width="${CLEAR_FROM * CELL}" height="${H}" fill="url(#${pattern})"/>` +
    `<rect x="${CLEAR_TO * CELL}" y="0" width="${(COLS - CLEAR_TO) * CELL}" height="${H}" fill="url(#${pattern})"/>`

  built =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges">` +
    `<style>${STYLE}</style><defs>${defs}</defs>` +
    `<rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" class="w0"/>` +
    picture() +
    `<rect x="${CLEAR_FROM * CELL}" y="0" width="${(CLEAR_TO - CLEAR_FROM) * CELL}" height="${H}" fill="url(#ghost)"/>` +
    strips('joints') +
    strips('frames') +
    rivets() +
    burn() +
    glints() +
    sweep() +
    dust() +
    sheet(17, 26, 0) +
    sheet(71, 33, 15) +
    shimmer() +
    `</svg>`
  return built
}
