// Preview one backdrop scene outside the app: writes the SVG, a mock of the desktop layout over it, and two screenshots.
//
//   node tools/preview.mts <scene file> <export name> <light|dark> <out dir>
//   e.g. node tools/preview.mts hooks/moon.ts moonWindowSvg dark /tmp/bg
//
// The mock draws the sidebar (left 13.2%) and a dashed box where the conversation column sits (35.2%..77.8%), as measured
// in the desktop app at a common window size. Nothing with contrast may sit inside that box (RULES.md, rule 1).
// Screenshots need Google Chrome (set CHROME to its binary if it is not at the macOS default). Headless screenshots do
// not advance CSS animation: play the motion in a real browser (see skills/new-backdrop/SKILL.md).

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [file, name, mode, out] = process.argv.slice(2)
if (!file || !name || !mode || !out) {
  console.error('usage: node tools/preview.mts <scene file> <export name> <light|dark> <out dir>')
  process.exit(2)
}

const mod = await import(resolve(file))
const svg: string = mod[name]()
const problems: string[] = []
if (svg.length >= 131072) problems.push(`too long: ${svg.length} characters (limit 131072)`)
if (svg.includes('<filter')) problems.push('uses <filter>: the desktop drops it and everything inside it')
if (svg.includes('<mask')) problems.push('uses <mask>: avoid (RULES.md, rule 5)')

mkdirSync(out, { recursive: true })
writeFileSync(`${out}/scene.svg`, svg)

const dark = mode === 'dark'
const glass = dark ? 'rgba(12,18,15,.55)' : 'rgba(245,243,236,.5)'
const ink = dark ? '#e6eedf' : '#1b1a17'
const line = dark ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)'
const mock =
  `<div style="position:fixed;left:0;top:0;bottom:0;width:13.2%;background:${glass};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)"></div>` +
  `<div style="position:fixed;left:35.2%;width:42.6%;top:7%;bottom:4%;border:1px dashed ${line};background:${glass};backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font:14px/1.7 -apple-system,sans-serif;color:${ink};padding:16px;box-sizing:border-box">` +
  `對話欄（模擬）<br>這是放在背景上的文字。The quick brown fox jumps over the lazy dog.</div>`
writeFileSync(
  `${out}/mock.html`,
  `<!doctype html><meta charset=utf-8><style>html,body{margin:0;height:100%;background:#000}svg{position:fixed;inset:0}</style>${svg}${mock}`,
)

const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const shot = (src: string, png: string, size: string) =>
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${size}`, '--virtual-time-budget=1500', `--screenshot=${png}`, `file://${src}`], { stdio: 'ignore' })
let shots = 'scene.png, mock.png'
try {
  shot(resolve(`${out}/scene.svg`), resolve(`${out}/scene.png`), '1600,1000')
  shot(resolve(`${out}/mock.html`), resolve(`${out}/mock.png`), '1500,975')
} catch {
  shots = 'no screenshots (Chrome not found: set CHROME)'
}

console.log(`${svg.length} characters; wrote ${out}/scene.svg, mock.html, ${shots}`)
for (const p of problems) console.log(`PROBLEM: ${p}`)
