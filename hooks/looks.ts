// The backdrops this plugin offers. To add one: write its scene in a file of its own (see RULES.md and
// skills/new-backdrop/SKILL.md), import it here, and add an entry to LOOKS. `key` is what /backdrop takes.

import type { ThemeSetArgs } from 'claude-code'

import { nightCrossingSvg } from './crossing'
import { makeColors } from './make-colors.js'
import { moonWindowSvg } from './moon'
import { atriumNoonSvg } from './scene'

export type Look = {
  /** What /backdrop takes: short, lower case, no spaces. */
  key: string
  /** The scene's name the engine hands back to the Backdrop hook: 1 to 64 of letters, digits, `_` and `-`. */
  scene: string
  title: string
  blurb: string
  window: 'light' | 'dark'
  colors: ReturnType<typeof makeColors>
  glass: { blur: number; tint: string; opacity: number }
  svg: () => string
  alt: string
}

const noonColors = makeColors({
  label: 'Atrium Noon',
  only: 'light',
  roles: { accent: '#2f4a5c', danger: '#b3392f', success: '#4e7d3a', warning: '#a8791a', pro: '#6d4f94' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#e9e7df',
        'surface-1': '#f1efe8',
        'surface-2': '#f7f6f1',
        'surface-3': '#f7f6f1',
        'text-primary': '#1b1a17',
        'text-secondary': '#45423a',
        'text-muted': '#5e5a50',
      },
    },
  },
})

const moonColors = makeColors({
  label: 'Moon Window',
  only: 'dark',
  roles: { accent: '#7fb89a', danger: '#d0564a', success: '#8cbf5a', warning: '#d9a13b', pro: '#a58bd6' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0c120f',
        'surface-1': '#121a16',
        'surface-2': '#17211c',
        'surface-3': '#1b2620',
        'text-primary': '#e6eedf',
        'text-secondary': '#bccab8',
        'text-muted': '#94a491',
      },
    },
  },
})

const crossingColors = makeColors({
  label: 'Night Crossing',
  only: 'dark',
  roles: { accent: '#d8b24a', danger: '#e5484d', success: '#7fbf6a', warning: '#e08a2e', pro: '#a58bd6' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b100d',
        'surface-1': '#111813',
        'surface-2': '#162019',
        'surface-3': '#1a251d',
        'text-primary': '#e8ede4',
        'text-secondary': '#c1cbbd',
        'text-muted': '#97a493',
      },
    },
  },
})

export const LOOKS: Look[] = [
  {
    key: 'noon',
    scene: 'atrium-noon',
    title: '白晝中庭 Atrium Noon',
    blurb: '方塊・過曝的玻璃中庭 / Tiles: an overexposed glass atrium, the catwalk burnt out by noon light',
    window: 'light',
    colors: noonColors,
    glass: { blur: 10, tint: '#f5f3ec', opacity: 0.5 },
    svg: atriumNoonSvg,
    alt: 'A tiled glass atrium at noon: white panes, black steel columns, a catwalk on the left and a staircase on the right',
  },
  {
    key: 'moon',
    scene: 'moon-window',
    title: '月之圓窗 Moon Window',
    blurb: '剪紙・圓窗與滿月 / Cut paper: a round window, a green night sky, a full moon, iron tracery with blinking eyes',
    window: 'dark',
    colors: moonColors,
    glass: { blur: 14, tint: '#0c120f', opacity: 0.55 },
    svg: moonWindowSvg,
    alt: 'A cut-paper round window at the right edge: a green night sky, a full moon, black crack-like tracery with almond eyes',
  },
  {
    key: 'crossing',
    scene: 'night-crossing',
    title: '夜之平交道 Night Crossing',
    blurb: '點陣・平交道紅燈 / Dots: a level crossing at night, red lamps flashing in turn, a ringing bell',
    window: 'dark',
    colors: crossingColors,
    glass: { blur: 14, tint: '#0b100d', opacity: 0.55 },
    svg: nightCrossingSvg,
    alt: 'An LED dot-matrix level crossing at night: striped posts, a crossbuck, a bell, and red lamps flashing in turn on both sides',
  },
]

/** The look as `$.theme.set` takes it. The scene's name goes under both keys: newer apps read `scene`, older ones `id`. */
export function themeOf(look: Look): ThemeSetArgs {
  return {
    colors: look.colors.theme,
    overrideColorScheme: look.window,
    backdrop: { scene: look.scene, id: look.scene, glass: look.glass } as ThemeSetArgs['backdrop'],
  }
}
