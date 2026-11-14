// Night Crossing: a level crossing at night, drawn on an LED dot lattice.
// Elements kept from the reference: a near-black green night with fine specks of stars, posts striped yellow and black,
// pairs of round signal lamps (one lit red, one dark), the red glow round a lit lamp, a pale alarm bell, the yellow
// crossbuck at the top.
// Moved to keep the conversation column clear (x 432..1250 holds only unlit dots): the near side of the crossing stands
// in the right strip with the big lamps, the bell and the crossbuck; the far side's post and smaller lamps stand in the
// left strip, so the conversation sits on the road between them. Each lamp's glow stays inside its own strip.
// Left out on purpose: the reference's black letterbox bars belong to the film's frame, not the scene; drawn into a
// backdrop they cut the picture down to a band across the middle of the window.
// Medium: dots only, on a 10-unit lattice (160 by 100). Every surface is cells filled with a dot pattern; a
// lit dot carries its own small halo; the glow round a lamp is rings of smaller and dimmer dots.
// Motion: the lamps flash left and right in turn, as a crossing's do; the bell sends rings of dots out as it rings;
// stars twinkle. Lamps switch with `visibility`, in steps, so most frames paint nothing. No filters, no masks.
// Pure string building: the same output on every call.

const PITCH = 10
const COLS = 160
const ROWS = 100
const TOP = 0
const BOTTOM = ROWS

const LEFT_FROM = 21 // left strip, columns 21..43
const LEFT_TO = 43
const RIGHT_FROM = 125 // right strip, columns 125..159

// Adapted from Anthropic's theme-examples plugin (Apache-2.0).
function hash(a: number, b: number): number {
  let h = (Math.round(a) * 374761393 + Math.round(b) * 668265263) >>> 0
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

type Cells = Set<number>
const key = (c: number, r: number) => r * COLS + c

function cellsWhere(test: (c: number, r: number) => boolean, from = 0, to = COLS - 1): Cells {
  const out: Cells = new Set()
  for (let r = TOP; r < BOTTOM; r += 1) {
    for (let c = from; c <= to; c += 1) {
      if (test(c, r)) out.add(key(c, r))
    }
  }
  return out
}

function minus(a: Cells, ...others: Cells[]): Cells {
  const out: Cells = new Set()
  for (const k of a) if (!others.some(o => o.has(k))) out.add(k)
  return out
}

/** Cells joined into pitch-aligned rectangles: runs along a row, then equal runs stacked down. One path. */
function rects(cells: Cells): string {
  type Rect = [number, number, number, number]
  const out: Rect[] = []
  let open = new Map<string, Rect>()
  for (let r = TOP; r < BOTTOM; r += 1) {
    const next = new Map<string, Rect>()
    let c = 0
    while (c < COLS) {
      if (!cells.has(key(c, r))) {
        c += 1
        continue
      }
      const s = c
      while (c < COLS && cells.has(key(c, r))) c += 1
      const k = `${s},${c - s}`
      const rect = open.get(k)
      if (rect !== undefined) {
        rect[3] += 1
        next.set(k, rect)
      } else {
        const fresh: Rect = [s, r, c - s, 1]
        out.push(fresh)
        next.set(k, fresh)
      }
    }
    open = next
  }
  return out.map(([x, y, w, h]) => `M${x * PITCH} ${y * PITCH}h${w * PITCH}v${h * PITCH}h-${w * PITCH}z`).join('')
}

const fill = (pattern: string, cells: Cells, cls = '') =>
  cells.size === 0 ? '' : `<path${cls ? ` class="${cls}"` : ''} fill="url(#${pattern})" d="${rects(cells)}"/>`

const disc = (cx: number, cy: number, r0: number, r1: number, from: number, to: number) =>
  cellsWhere((c, r) => {
    const d = Math.hypot(c - cx, r - cy)
    return d >= r0 && d < r1
  }, from, to)

/** A thick straight bar between two cells. */
function bar(c0: number, r0: number, c1: number, r1: number, half: number, from: number, to: number): Cells {
  const dx = c1 - c0
  const dy = r1 - r0
  const len2 = dx * dx + dy * dy
  return cellsWhere((c, r) => {
    const t = Math.max(0, Math.min(1, ((c - c0) * dx + (r - r0) * dy) / len2))
    return Math.hypot(c - (c0 + t * dx), r - (r0 + t * dy)) <= half
  }, from, to)
}

/** A post striped yellow and black: returns [yellow cells, dark cells]. */
function post(c0: number, width: number, yellowRows: number, darkRows: number, from: number, to: number): [Cells, Cells] {
  const yellow: Cells = new Set()
  const dark: Cells = new Set()
  const period = yellowRows + darkRows
  for (let r = TOP; r < BOTTOM; r += 1) {
    for (let c = c0; c < c0 + width; c += 1) {
      if (c < from || c > to) continue
      ;((r - TOP) % period < yellowRows ? yellow : dark).add(key(c, r))
    }
  }
  return [yellow, dark]
}

/** A bell: a flared cup opening downward, with a darker mouth. Returns [body, mouth]. */
function bell(cx: number, top: number, h: number, w: number): [Cells, Cells] {
  const body = cellsWhere((c, r) => {
    const t = (r - top) / h
    if (t < 0 || t > 1) return false
    const half = (w / 2) * (0.45 + 0.55 * t * t)
    return Math.abs(c - cx) <= half
  })
  const mouth = cellsWhere((c, r) => r >= top + h - 1 && r <= top + h && Math.abs(c - cx) <= w / 2 - 1)
  const cap = cellsWhere((c, r) => r === top - 1 && Math.abs(c - cx) <= 1)
  return [new Set([...body, ...cap]), mouth]
}

type Lamp = { c: number; r: number; lens: number; rim: number; halo: number[]; from: number; to: number; side: 'a' | 'b'; behind?: Cells }

/** One signal lamp: a dark housing, a dark lens, and a lit lens with rings of glow that only show while it is on. */
function lamp(l: Lamp): { off: string; on: string } {
  // A post standing in front hides what of the lamp lies behind it.
  const front = l.behind ?? new Set<number>()
  const rim = minus(disc(l.c, l.r, l.lens, l.rim, l.from, l.to), front)
  const lens = disc(l.c, l.r, 0, l.lens, l.from, l.to)
  const [h1, h2, h3] = l.halo
  const ring1 = minus(disc(l.c, l.r, l.rim, h1 ?? l.rim, l.from, l.to), rim, front)
  const ring2 = minus(disc(l.c, l.r, h1 ?? l.rim, h2 ?? l.rim, l.from, l.to), front)
  const ring3 = minus(disc(l.c, l.r, h2 ?? l.rim, h3 ?? l.rim, l.from, l.to), front)
  const cls = `on${l.side.toUpperCase()}`
  return {
    off: fill('housing', rim) + fill('lensOff', lens),
    on: fill('halo3', ring3, cls) + fill('halo2', ring2, cls) + fill('halo1', ring1, cls) + fill('lensOn', lens, cls),
  }
}

/** Rings of dots spreading from the bell, shown one after another while it rings. */
function soundRings(cx: number, cy: number, from: number, to: number): string {
  let out = ''
  ;[5, 8, 11].forEach((radius, i) => {
    const arc = cellsWhere((c, r) => {
      const d = Math.hypot(c - cx, r - cy)
      const a = Math.atan2(r - cy, c - cx)
      return Math.abs(d - radius) < 0.55 && a < -Math.PI * 0.08 && a > -Math.PI * 0.62
    }, from, to)
    out += `<path class="ring" style="animation-delay:${(i * 0.3).toFixed(1)}s" fill="url(#wave)" d="${rects(arc)}"/>`
  })
  return out
}

/** Stars: single lit dots in the side strips, twinkling on staggered cycles. */
function stars(): string {
  let out = ''
  let n = 0
  for (let i = 0; i < 900 && n < 34; i += 1) {
    const left = i % 3 === 0
    const c = left ? LEFT_FROM + Math.floor(hash(i, 1) * (LEFT_TO - LEFT_FROM + 1)) : RIGHT_FROM + Math.floor(hash(i, 1) * (COLS - RIGHT_FROM))
    const r = TOP + 1 + Math.floor(hash(i, 2) * (BOTTOM - TOP - 2))
    if (taken.has(key(c, r))) continue
    taken.add(key(c, r))
    const dur = 2.5 + hash(i, 3) * 4
    out += `<circle class="tw" style="animation-duration:${dur.toFixed(1)}s;animation-delay:-${(hash(i, 4) * dur).toFixed(1)}s" cx="${c * PITCH + 5}" cy="${r * PITCH + 5}" r="${(1.3 + hash(i, 5) * 0.9).toFixed(1)}" fill="#d3e2cf"/>`
    n += 1
  }
  return out
}

// Cells something solid already sits on, so stars avoid them.
const taken: Cells = new Set()
const claim = (...sets: Cells[]) => sets.forEach(s => s.forEach(k => taken.add(k)))

function dotPattern(id: string, radius: number, colour: string): string {
  return `<pattern id="${id}" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="${radius}" fill="${colour}"/></pattern>`
}

const DEFS =
  dotPattern('lattice', 1.15, '#16241b') +
  dotPattern('yellow', 3.4, '#ddb03d') +
  dotPattern('yellowFar', 2.9, '#a5842f') +
  dotPattern('stripe', 3.1, '#2b2b24') +
  dotPattern('metal', 2.6, '#353d36') +
  dotPattern('housing', 3, '#262e28') +
  dotPattern('lensOff', 3.5, '#341a16') +
  dotPattern('halo1', 3, '#d42a1f') +
  dotPattern('halo2', 2.2, '#982019') +
  dotPattern('halo3', 1.5, '#5e1611') +
  dotPattern('bellBody', 3.2, '#d8dccd') +
  dotPattern('bellMouth', 3, '#7d857a') +
  dotPattern('bellFar', 2.6, '#9ea596') +
  dotPattern('crossbuck', 3.3, '#e0b33f') +
  dotPattern('wave', 1.9, '#bcc6b6') +
  `<radialGradient id="lit"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".55"/><stop offset=".55" stop-color="#ff3a2a" stop-opacity=".2"/><stop offset="1" stop-color="#ff3a2a" stop-opacity="0"/></radialGradient>` +
  `<pattern id="lensOn" width="${PITCH}" height="${PITCH}" patternUnits="userSpaceOnUse"><rect width="${PITCH}" height="${PITCH}" fill="url(#lit)"/><circle cx="5" cy="5" r="3.9" fill="#ff3324"/><circle cx="5" cy="5" r="1.5" fill="#ffc2b4"/></pattern>`

const STYLE =
  // The two lamps of a pair flash in turn; the far pair keeps time with the near one.
  '.onA{animation:flashA 2.6s steps(1) infinite}.onB{animation:flashB 2.6s steps(1) infinite}' +
  '@keyframes flashA{0%{visibility:visible}50%{visibility:hidden}}' +
  '@keyframes flashB{0%{visibility:hidden}50%{visibility:visible}}' +
  '.ring{visibility:hidden;animation:ring 1.3s steps(1) infinite}' +
  '@keyframes ring{0%{visibility:visible}35%,100%{visibility:hidden}}' +
  '.tw{animation-name:tw;animation-timing-function:steps(3);animation-iteration-count:infinite;animation-direction:alternate}' +
  '@keyframes tw{from{fill-opacity:.15}to{fill-opacity:.9}}' +
  '@media (prefers-reduced-motion: reduce){.onA,.onB,.ring,.tw{animation:none}.onB,.ring{visibility:hidden}}'

let built: string | undefined

export function nightCrossingSvg(): string {
  if (built !== undefined) return built
  taken.clear()

  // ---- Right strip: the near side ----
  const R0 = RIGHT_FROM
  const R1 = COLS - 1
  const [postY, postK] = post(145, 3, 6, 4, R0, R1)
  const arm = cellsWhere((c, r) => (r === 49 || r === 50) && c >= 133 && c <= 158)
  const bracket = cellsWhere((c, r) => c >= 143 && c <= 149 && r >= 46 && r <= 53)
  const buck = new Set([...bar(134, 13, 156, 30, 1.3, R0, R1), ...bar(156, 13, 134, 30, 1.3, R0, R1)])
  const buckStripe = cellsWhere((c, r) => buck.has(key(c, r)) && Math.abs(c - 145) <= 1 && Math.abs(r - 21.5) <= 1)
  const [bellBody, bellMouth] = bell(137, 33, 8, 8)
  const lampA = lamp({ c: 137, r: 58, lens: 5, rim: 6.5, halo: [8.5, 10, 11.5], from: R0, to: R1, side: 'a', behind: new Set([...postY, ...postK]) })
  const lampB = lamp({ c: 153, r: 58, lens: 5, rim: 6.5, halo: [8.5, 10, 11.5], from: R0, to: R1, side: 'b', behind: new Set([...postY, ...postK]) })

  // ---- Left strip: the far side, smaller and dimmer ----
  const L0 = LEFT_FROM
  const L1 = LEFT_TO
  const [farY, farK] = post(31, 2, 5, 3, L0, L1)
  const farArm = cellsWhere((c, r) => r === 51 && c >= 22 && c <= 41)
  const [farBellBody, farBellMouth] = bell(25, 38, 6, 6)
  const farA = lamp({ c: 25, r: 56, lens: 3, rim: 4.2, halo: [5.2, 6, 6.8], from: L0, to: L1, side: 'a', behind: new Set([...farY, ...farK]) })
  const farB = lamp({ c: 37, r: 56, lens: 3, rim: 4.2, halo: [5.2, 6, 6.8], from: L0, to: L1, side: 'b', behind: new Set([...farY, ...farK]) })

  claim(postY, postK, arm, bracket, buck, bellBody, bellMouth, farY, farK, farArm, farBellBody, farBellMouth)
  ;[[137, 58, 11.5], [153, 58, 11.5], [25, 56, 6.8], [37, 56, 6.8], [137, 37, 12]].forEach(([c, r, rad]) =>
    claim(disc(c ?? 0, r ?? 0, 0, rad ?? 0, 0, COLS - 1)),
  )

  const lattice = cellsWhere(() => true)

  const scene =
    fill('lattice', lattice) +
    // far side (left)
    fill('metal', farArm) +
    fill('bellFar', farBellBody) +
    fill('bellMouth', farBellMouth) +
    farA.off + farB.off + farA.on + farB.on +
    fill('yellowFar', farY) +
    fill('stripe', farK) +
    // near side (right)
    fill('crossbuck', minus(buck, buckStripe)) +
    fill('stripe', buckStripe) +
    fill('metal', arm) +
    fill('metal', minus(bracket, postY, postK)) +
    fill('bellBody', bellBody) +
    fill('bellMouth', bellMouth) +
    lampA.off + lampB.off + lampA.on + lampB.on +
    fill('yellow', postY) +
    fill('stripe', postK) +
    soundRings(137, 39, R0, R1) +
    stars()

  built =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS * PITCH} ${ROWS * PITCH}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">` +
    `<style>${STYLE}</style><defs>${DEFS}</defs>` +
    `<rect x="-40" y="-40" width="${COLS * PITCH + 80}" height="${ROWS * PITCH + 80}" fill="#080d0a"/>` +
    scene +
    `</svg>`
  return built
}
