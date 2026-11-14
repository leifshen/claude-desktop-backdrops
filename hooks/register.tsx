import type { EngineInterface, Register } from 'claude-code'

import { makeColors } from './make-colors.js'
import { LOOKS, themeOf, type Look } from './looks'

const COMMAND = 'backdrop'
// What this plugin keeps across sessions: the key of the chosen look, or 'off'.
const CHOICE_KEY = 'choice'

const cache = new Map<string, string>()
const svgOf = (look: Look) => {
  let svg = cache.get(look.key)
  if (svg === undefined) {
    svg = look.svg()
    cache.set(look.key, svg)
  }
  return svg
}

/**
 * Your own backdrops, kept out of the repository: `private/looks.json` lists them, each with its SVG file beside it
 * (see README, "Private backdrops"). For scenes made from artwork that is not yours to share. Read at each session
 * start; a missing or broken file means there are none.
 */
type PrivateEntry = {
  key: string
  scene: string
  title: string
  blurb: string
  window: 'light' | 'dark'
  glass: { blur: number; tint: string; opacity: number }
  svg: string
  alt: string
  roles: Record<string, string>
  anchors: Record<string, string>
}

let privateLooks: Look[] = []

/**
 * The scene's name as the app sees it: the look's name plus a short fingerprint of its drawing. The app keeps what
 * it drew for a scene name, so a changed drawing under the same name never shows; a new name makes it draw again.
 */
const ids = new Map<string, string>()
function sceneId(look: Look): string {
  let id = ids.get(look.key)
  if (id === undefined) {
    const svg = svgOf(look)
    let h = 5381
    for (let i = 0; i < svg.length; i += 1) h = ((h * 33) ^ svg.charCodeAt(i)) >>> 0
    id = `${look.scene}-${h.toString(36)}`.slice(0, 64)
    ids.set(look.key, id)
  }
  return id
}

async function loadPrivate($: EngineInterface): Promise<void> {
  try {
    const root = `${$.plugin.root}/private`
    const entries = JSON.parse(await $.fs.read(`${root}/looks.json`)) as PrivateEntry[]
    const out: Look[] = []
    for (const p of entries) {
      const svg = await $.fs.read(`${root}/${p.svg}`)
      const mode = { gray: { anchors: p.anchors } }
      const colors = makeColors({
        label: p.title,
        only: p.window,
        roles: p.roles,
        ...(p.window === 'dark' ? { dark: mode } : { light: mode }),
      } as Parameters<typeof makeColors>[0])
      out.push({ key: p.key, scene: p.scene, title: p.title, blurb: p.blurb, window: p.window, colors, glass: p.glass, svg: () => svg, alt: p.alt })
      cache.delete(p.key)
      ids.delete(p.key)
    }
    privateLooks = out
  } catch {
    privateLooks = []
  }
}

const allLooks = () => [...LOOKS, ...privateLooks]

function listText(current: string | undefined): string {
  const rows = allLooks().map(l => `${l.key === current ? '▶' : '·'} ${l.key}  ${l.title} (${l.window === 'light' ? '淺色 light' : '深色 dark'}) — ${l.blurb}`)
  return ['背景 Backdrops:', ...rows, '', '/backdrop <name> 套用 apply · /backdrop off 關閉 off · /backdrop list 列出 list'].join('\n')
}

async function apply($: EngineInterface, look: Look): Promise<string> {
  const unpainted = look.colors.problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) {
    return `${look.title}: ${unpainted}`
  }
  const set = await $.theme.set(themeOf({ ...look, scene: sceneId(look) }))
  await $.store.set(CHOICE_KEY, look.key)
  return set.isDrawn ? `已套用 Applied: ${look.title}` : `${look.title}: set, but this window says it draws no theme: ${set.reason}`
}

async function chosen($: EngineInterface): Promise<string | undefined> {
  const kept = await $.store.get(CHOICE_KEY)
  return typeof kept === 'string' ? kept : undefined
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Animated backdrops 動態背景: /backdrop list · /backdrop <name> · /backdrop off',
    })
    await loadPrivate($)
    // Every new session takes the look chosen last, in any session. 'off' or nothing chosen: leave the window alone.
    const key = await chosen($)
    const look = allLooks().find(l => l.key === key)
    if (look !== undefined) {
      const said = await apply($, look)
      if (!said.startsWith('已套用 Applied')) {
        $.ui.toast(said)
      }
    }
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = String(e.args ?? '').trim().toLowerCase()
    // Read the private list again, so a scene added since the session started shows up.
    await loadPrivate($)
    const current = await chosen($)
    if (arg === '' || arg === 'list' || arg === 'help') {
      return { text: listText(current) }
    }
    if (arg === 'off') {
      // Clearing is the person's ask here, so it may take whatever theme stands.
      await $.theme.clear()
      await $.store.set(CHOICE_KEY, 'off')
      return { text: '背景已關閉 Backdrop off (new sessions stay plain too).' }
    }
    const look = allLooks().find(l => l.key === arg)
    if (look === undefined) {
      return { text: `沒有這個背景 No backdrop called "${arg}".\n\n${listText(current)}` }
    }
    return { text: await apply($, look) }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const props = e.props as { scene?: unknown; id?: unknown }
    const name = typeof props.scene === 'string' ? props.scene : typeof props.id === 'string' ? props.id : undefined
    const look = allLooks().find(l => sceneId(l) === name || l.scene === name)

    // Match on the scene's own name, not the plugin's: a copy loaded from a dev folder carries another plugin name.
    if (look === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt={look.alt} source={svgOf(look)} />
  })
}
