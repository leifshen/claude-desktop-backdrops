import type { EngineInterface, Register } from 'claude-code'

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

function listText(current: string | undefined): string {
  const rows = LOOKS.map(l => `${l.key === current ? '▶' : '·'} ${l.key}  ${l.title} (${l.window === 'light' ? '淺色 light' : '深色 dark'}) — ${l.blurb}`)
  return ['背景 Backdrops:', ...rows, '', '/backdrop <name> 套用 apply · /backdrop off 關閉 off · /backdrop list 列出 list'].join('\n')
}

async function apply($: EngineInterface, look: Look): Promise<string> {
  const unpainted = look.colors.problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) {
    return `${look.title}: ${unpainted}`
  }
  const set = await $.theme.set(themeOf(look))
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
    // Every new session takes the look chosen last, in any session. 'off' or nothing chosen: leave the window alone.
    const key = await chosen($)
    const look = LOOKS.find(l => l.key === key)
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
    const look = LOOKS.find(l => l.key === arg)
    if (look === undefined) {
      return { text: `沒有這個背景 No backdrop called "${arg}".\n\n${listText(current)}` }
    }
    return { text: await apply($, look) }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const props = e.props as { scene?: unknown; id?: unknown }
    const name = typeof props.scene === 'string' ? props.scene : typeof props.id === 'string' ? props.id : undefined
    const look = LOOKS.find(l => l.scene === name)

    // Match on the scene's own name, not the plugin's: a copy loaded from a dev folder carries another plugin name.
    if (look === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt={look.alt} source={svgOf(look)} />
  })
}
