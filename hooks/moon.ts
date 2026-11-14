// Moon Window, cut-paper edition (v3). Follows RULES.md.
// Elements kept from the reference: a near-black wall; a great round window with a thick dark stone ring, a pale mint
// inner ring and a dark hairline; a green night sky that brightens toward the moon, with stars; a full moon lit from the
// lower left with olive seas to the upper right; black crack-like iron tracery rising from below; almond eyes with rays
// set in the tracery; torn paper patches printed with a dot screen.
// Moved to keep the conversation column clear (x 432..1250 holds nothing): the window sits at the right edge, half of it
// past the frame; the torn patches sit in the left strip, a large faint one under the sidebar.
// Medium: cut paper only. Every piece is a faceted outline drawn four times: far shadow, near shadow, a light lip up and
// left, the paper itself. The moon's glow is stacked paper discs, not a gradient.
// Motion: the glow discs breathe, stars twinkle, the eyes blink and look about, the patches sway on their tape.
// No filters, no masks. Pure string building: the same output on every call.

type Pt = [number, number]

const W = 1600
const H = 1000

// The window: its centre on the right edge.
const WX = 1600
const WY = 400
const SKY = 293

// The moon, inside the window.
const MX = 1452
const MY = 300
const MR = 102

const PAINTS: Record<string, string> = {
  wall: '#0a0d0b',
  shadow: '#000000',
  lip: '#e9f2dc',
  stone: '#232c24',
  mint: '#a7c4a3',
  line: '#060807',
  sky0: '#0e2119',
  sky1: '#143024',
  sky2: '#1b412f',
  sky3: '#26563c',
  sky4: '#376e4c',
  sky5: '#58895f',
  moon: '#cfcb8c',
  moonLit: '#f7f4d2',
  sea: '#b9b676',
  seaDeep: '#9f9c5e',
  iron: '#060807',
  eyeIn: '#2a5a3e',
  patch: '#19211c',
  patchFaint: '#121814',
  dot: '#2f3d34',
  star: '#dbe8c6',
}

// Adapted from Anthropic's theme-examples plugin (Apache-2.0).
function hash(a: number, b: number): number {
  let h = (Math.round(a) * 374761393 + Math.round(b) * 668265263) >>> 0
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const f = (n: number) => (Math.round(n * 10) / 10).toString()

function poly(points: Pt[]): string {
  return 'M' + points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z'
}

/** A scissor-cut disc: a polygon whose corners wander a little in and out. */
function disc(cx: number, cy: number, r: number, sides: number, seed: number, wobble = 0.012): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < sides; i += 1) {
    const t = (i / sides) * Math.PI * 2 + hash(seed, i) * 0.04
    const rr = r * (1 + (hash(seed, i + 99) - 0.5) * 2 * wobble)
    pts.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr])
  }
  return pts
}

/** A ring: outer disc with the inner one cut out (even-odd). */
function ring(cx: number, cy: number, r0: number, r1: number, sides: number, seed: number, wobble = 0.006): string {
  const outer = disc(cx, cy, r1, sides, seed, wobble)
  const inner = disc(cx, cy, r0, sides, seed + 7, wobble).reverse()
  return poly(outer) + poly(inner)
}

/** A torn rectangle: every edge ragged. */
function torn(x: number, y: number, w: number, h: number, seed: number): Pt[] {
  const pts: Pt[] = []
  const step = 14
  const rag = (i: number, k: number) => (hash(seed + k, i) - 0.5) * 12
  for (let i = 0; i < w; i += step) pts.push([x + i, y + rag(i, 1)])
  for (let j = 0; j < h; j += step) pts.push([x + w + rag(j, 2), y + j])
  for (let i = w; i > 0; i -= step) pts.push([x + i, y + h + rag(i, 3)])
  for (let j = h; j > 0; j -= step) pts.push([x + rag(j, 4), y + j])
  return pts
}

// ---- Paper: four draws of one outline -----------------------------------------------------------------------

const shapes: Array<[string, string]> = []

function shape(id: string, d: string): string {
  shapes.push([id, d])
  return id
}

function use(id: string, dx: number, dy: number, cls: string): string {
  const t = dx || dy ? ` transform="translate(${f(dx)} ${f(dy)})"` : ''
  return `<use href="#${id}"${t} class="${cls}"/>`
}

/** One piece of paper lifted `lift` above what lies under it. */
function paper(id: string, fill: string, lift: number, lip = true): string {
  return (
    use(id, lift * 1.9, lift * 2.4, 'shadow far') +
    use(id, lift * 0.9, lift * 1.15, 'shadow near') +
    (lip ? use(id, -1.2, -1.2, 'lip edge') : '') +
    use(id, 0, 0, fill)
  )
}

// ---- The window ----------------------------------------------------------------------------------------------

function sky(): string {
  // Base sky, then glow discs stacked toward the moon, each a cut layer that breathes on its own pace.
  const base = shape('sky0', poly(disc(WX, WY, SKY + 4, 90, 3, 0)))
  const layers: Array<[string, number, number]> = [
    ['sky1', MR + 230, 15],
    ['sky2', MR + 160, 13],
    ['sky3', MR + 105, 11],
    ['sky4', MR + 58, 9],
    ['sky5', MR + 24, 7],
  ]
  let out = use(base, 0, 0, 'sky0')
  layers.forEach(([paint, r, secs], i) => {
    // Each disc's centre leans a little toward the lower left, where the light comes from.
    const id = shape(`glow${i}`, poly(disc(MX - (i + 1) * 3, MY + (i + 1) * 4, r, 56, 20 + i, 0.018)))
    out +=
      `<g class="breathe" style="animation-duration:${secs}s;animation-delay:-${f(hash(i, 3) * secs)}s">` +
      paper(id, paint, 2.5, false) +
      `</g>`
  })
  return out
}

function stars(): string {
  let out = ''
  let n = 0
  for (let i = 0; i < 600 && n < 70; i += 1) {
    const x = WX - SKY + hash(i, 1) * SKY
    const y = WY - SKY + hash(i, 2) * SKY * 2
    if (Math.hypot(x - WX, y - WY) > SKY - 10) continue
    if (Math.hypot(x - MX, y - MY) < MR + 34) continue
    const r = 1.2 + hash(i, 3) * 1.6
    const dur = 3 + hash(i, 4) * 5
    out += `<circle class="tw star" style="animation-duration:${f(dur)}s;animation-delay:-${f(hash(i, 5) * dur)}s" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`
    n += 1
  }
  return out
}

function moon(): string {
  const face = shape('moonFace', poly(disc(MX, MY, MR, 44, 41, 0.008)))
  // The lit side: a second disc pushed toward the lower left, cut to the moon's edge.
  const litId = shape('moonLit', poly(disc(MX - 22, MY + 26, MR * 0.86, 40, 43, 0.01)))
  // Seas: scissor-cut blobs toward the upper right.
  const seas: string[] = []
  const blobs: Array<[number, number, number, number, string]> = [
    [MX + 30, MY - 52, 30, 19, 'sea'],
    [MX + 58, MY - 12, 24, 17, 'seaDeep'],
    [MX + 20, MY - 26, 18, 13, 'sea'],
    [MX + 62, MY + 22, 16, 12, 'sea'],
    [MX - 8, MY - 70, 14, 10, 'seaDeep'],
    [MX + 72, MY - 46, 12, 9, 'sea'],
  ]
  blobs.forEach(([x, y, rx, ry, paint], i) => {
    const pts = disc(0, 0, 1, 11, 60 + i, 0.18).map(([px, py]) => [x + px * rx, y + py * ry] as Pt)
    seas.push(paper(shape(`sea${i}`, poly(pts)), paint, 1, false))
  })
  return paper(face, 'moon', 3) + `<g clip-path="url(#moonCut)">${use(litId, 0, 0, 'moonLit')}${seas.join('')}</g>`
}

/** A crack-like iron line: short straight runs that kink left and right, with a few spurs. */
function crack(seed: number, x: number, y: number, angle: number, length: number, spurs: number): string {
  let d = `M${f(x)} ${f(y)}`
  let cx = x
  let cy = y
  let walked = 0
  let k = 0
  while (walked < length) {
    const seg = 22 + hash(seed, k) * 34
    const a = angle + (k % 2 === 0 ? 1 : -1) * (0.16 + hash(seed, k + 50) * 0.32)
    cx += Math.cos(a) * seg
    cy += Math.sin(a) * seg
    d += `L${f(cx)} ${f(cy)}`
    if (spurs > 0 && hash(seed, k + 90) < 0.3) {
      const side = hash(seed, k + 120) < 0.5 ? -1 : 1
      const sa = angle + side * (0.7 + hash(seed, k + 140) * 0.5)
      const sl = 16 + hash(seed, k + 160) * 26
      d += `M${f(cx)} ${f(cy)}L${f(cx + Math.cos(sa) * sl)} ${f(cy + Math.sin(sa) * sl)}M${f(cx)} ${f(cy)}`
      spurs -= 1
    }
    walked += seg
    k += 1
  }
  return d
}

function tracery(): string {
  const up = -Math.PI / 2
  const lines = [
    // from the bottom arc
    crack(11, 1338, 640, up + 0.55, 260, 2),
    crack(12, 1400, 690, up + 0.2, 330, 2),
    crack(13, 1468, 700, up + 0.02, 520, 3),
    crack(14, 1536, 698, up - 0.12, 300, 2),
    crack(17, 1590, 694, up - 0.04, 200, 1),
    // from the left rim, reaching in and up
    crack(15, 1316, 470, up + 1.15, 130, 1),
    crack(18, 1324, 300, up + 1.35, 120, 1),
    crack(19, 1372, 170, up + 2.0, 110, 1),
    // from the top, hanging down
    crack(16, 1520, 112, Math.PI / 2 - 0.18, 120, 1),
  ].join('')
  const id = shape('tracery', lines)
  return use(id, 4, 5, 'ironShadow far') + use(id, 2, 2.5, 'ironShadow near') + use(id, 0, 0, 'ironLine')
}

/** An almond eye cut in the iron, rays running toward the rim; it blinks now and then and looks about. */
function eye(x: number, y: number, rot: number, scale: number, i: number): string {
  let rays = ''
  for (let k = -2; k <= 2; k += 1) {
    const a = Math.PI / 2 + k * 0.2
    rays += `M${f(Math.cos(a) * 30)} ${f(Math.sin(a) * 20)}L${f(Math.cos(a) * 92)} ${f(Math.sin(a) * 92)}`
  }
  const lid = 'M-52 0Q0 -38 52 0Q0 38 -52 0Z'
  const blink = 8 + hash(i, 61) * 6
  const look = 9 + hash(i, 63) * 7
  return (
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})">` +
    `<path d="${rays}" class="ironShadow near" transform="translate(2 2.5)"/><path d="${rays}" class="ironLine thin"/>` +
    `<g class="blink" style="animation-duration:${f(blink)}s;animation-delay:-${f(hash(i, 62) * blink)}s">` +
    `<path d="${lid}" class="shadow near" transform="translate(2 2.5)"/>` +
    `<path d="${lid}" class="eyeIn"/>` +
    `<g class="look" style="animation-duration:${f(look)}s;animation-delay:-${f(hash(i, 64) * look)}s">` +
    `<circle r="14" class="ironLine thin"/><circle r="5" class="iron"/></g>` +
    `<path d="${lid}" class="ironLine"/>` +
    `</g></g>`
  )
}

function frame(): string {
  const stone = shape('stone', ring(WX, WY, SKY + 13, SKY + 60, 96, 71, 0.01))
  const mint = shape('mint', ring(WX, WY, SKY + 4, SKY + 13, 96, 72, 0.002))
  const line = shape('hair', ring(WX, WY, SKY, SKY + 4, 96, 73, 0.001))
  return paper(stone, 'stone', 5) + paper(mint, 'mint', 1.5) + paper(line, 'line', 0.8, false)
}

// ---- Torn, dot-printed patches -------------------------------------------------------------------------------

function patch(id: string, x: number, y: number, w: number, h: number, seed: number, faint: boolean, swing: number): string {
  const sid = shape(id, poly(torn(x, y, w, h, seed)))
  const fill = faint ? 'patchFaint' : 'patch'
  const dots = faint ? '' : use(sid, 0, 0, 'dots')
  return (
    `<g class="sway" style="transform-origin:${f(x + w / 2)}px ${f(y)}px;animation-duration:${swing}s;animation-delay:-${f(hash(seed, 9) * swing)}s">` +
    paper(sid, fill, faint ? 2 : 4) +
    dots +
    `</g>`
  )
}

// ---- Assembly ------------------------------------------------------------------------------------------------

const STYLE =
  Object.entries(PAINTS).map(([k, v]) => `.${k}{fill:${v}}`).join('') +
  '.far{opacity:.22}.near{opacity:.38}.edge{opacity:.12}' +
  '.dots{fill:url(#dots)}' +
  `.ironLine{fill:none;stroke:${PAINTS.iron};stroke-width:8;stroke-linejoin:miter;stroke-linecap:square}` +
  '.ironLine.thin{stroke-width:6}' +
  '.ironShadow{fill:none;stroke:#000;stroke-width:8;stroke-linejoin:miter;stroke-linecap:square}' +
  `.breathe{transform-origin:${MX}px ${MY}px;animation-name:breathe;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}` +
  '@keyframes breathe{from{transform:scale(.985)}to{transform:scale(1.025)}}' +
  '.tw{animation-name:tw;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}' +
  '@keyframes tw{from{opacity:.2}to{opacity:1}}' +
  '.blink{animation-name:blink;animation-timing-function:ease-in-out;animation-iteration-count:infinite}' +
  '@keyframes blink{0%,91%,100%{transform:scaleY(1)}94%{transform:scaleY(.06)}}' +
  '.look{animation-name:look;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}' +
  '@keyframes look{0%,30%{transform:translate(-9px,1px)}70%,100%{transform:translate(9px,-1px)}}' +
  '.sway{animation-name:sway;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}' +
  '@keyframes sway{from{transform:rotate(-1.1deg)}to{transform:rotate(1.3deg)}}' +
  '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'

let built: string | undefined

export function moonWindowSvg(): string {
  if (built !== undefined) return built
  shapes.length = 0

  const leftStrip =
    // under the sidebar: one large faint sheet that melts into the wall
    patch('pE', -30, 260, 230, 470, 5, true, 41) +
    patch('pA', 222, 96, 92, 300, 1, false, 23) +
    patch('pB', 240, 452, 128, 168, 2, false, 29) +
    patch('pC', 206, 700, 236, 330, 3, false, 37)

  const windowArt =
    `<g clip-path="url(#sky)">` +
    sky() +
    stars() +
    moon() +
    tracery() +
    eye(1350, 548, 32, 0.95, 1) +
    eye(1528, 604, -18, 1, 2) +
    eye(1556, 178, -64, 0.8, 3) +
    `</g>` +
    frame()

  const rightBottom = patch('pD', 1330, 846, 300, 190, 4, false, 31)

  const defs =
    shapes.map(([id, d]) => `<path id="${id}" d="${d}" fill-rule="evenodd"/>`).join('') +
    `<clipPath id="sky"><circle cx="${WX}" cy="${WY}" r="${SKY + 1}"/></clipPath>` +
    `<clipPath id="moonCut"><circle cx="${MX}" cy="${MY}" r="${MR - 1}"/></clipPath>` +
    `<pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.7" fill="${PAINTS.dot}"/></pattern>`

  built =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">` +
    `<style>${STYLE}</style><defs>${defs}</defs>` +
    `<rect x="-40" y="-40" width="${W + 80}" height="${H + 80}" class="wall"/>` +
    leftStrip +
    windowArt +
    rightBottom +
    `</svg>`
  return built
}
