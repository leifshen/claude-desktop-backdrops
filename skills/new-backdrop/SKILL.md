---
name: new-backdrop
description: Design a new animated backdrop for the Claude desktop app (Code tab), or change an existing one, inside the desktop-backdrops plugin, so /backdrop can switch to it. Use when the person gives a reference image or a description and asks for a new backdrop, theme, animated background, desktop background or "custom theme" (中文：做一個新背景、做成主題、動態背景、桌面背景、換背景). Needs Claude Code, whose mod engine draws the backdrop.
---

# Make a new backdrop

Reply in the person's language. The rules are in `RULES.md` at the plugin's root (this skill's folder is `skills/new-backdrop/`, two levels below it). Read them first and follow all five.

## 0. Find a folder you can edit

The plugin must be read from a folder the person owns, or edits never reach the app.

- Run `claude plugin list` and look at `desktop-backdrops`. If it says `Read from: <folder>`, that folder is the working copy: edit there.
- If it was installed from GitHub (no `Read from:` line, or a path under `~/.claude/plugins/cache/`), set up a working copy first, with the person's go-ahead:
  ```bash
  git clone https://github.com/leifshen/claude-desktop-backdrops.git ~/claude-desktop-backdrops
  claude plugin uninstall desktop-backdrops
  claude plugin marketplace add ~/claude-desktop-backdrops
  claude plugin install desktop-backdrops@leifshen
  ```
  From then on the app reads that folder; after an edit the person types `/reload-plugins`.

## 1. Before drawing

1. Look at the reference and **write down its recognisable elements** and main colours.
2. Decide, and tell the person in a few lines before drawing:
   - which strip holds the subject (right, x 1250–1600, or left, x 210–432) and what had to move to keep x 432–1250 clear;
   - which medium (tiles, cut paper or dots) and why it suits this picture;
   - light or dark window.
3. Learn the medium from working examples:
   - this plugin's `hooks/scene.ts` (tiles) and `hooks/moon.ts` (cut paper);
   - Anthropic's `theme-examples` plugin, if installed, under `~/.claude/plugins/cache/claude-plugins-official/theme-examples/<version>/hooks/scenes/`: `koi-mosaic.ts` (tiles), `paper-garden.ts` (cut paper), `braille-stars.ts`, `departure-board.ts`, `halftone-dawn.ts` (dots).

## 2. Draw

1. Write the scene as `hooks/<name>.ts`, exporting one function that returns the SVG string. Pure string building, the same output every call, no imports from outside. Open it with a comment: the elements kept, what moved, the medium, what moves.
2. Add an entry to `LOOKS` in `hooks/looks.ts`: `key` (what follows `/backdrop`), `scene`, a title, a one-line blurb, `window`, colours from `makeColors` (add `only: 'dark'` for a dark scene), `glass`, `svg`, `alt`.

## 3. Check

1. Preview, from the plugin folder:
   ```bash
   node tools/preview.mts hooks/<name>.ts <export name> <light|dark> <out folder>
   ```
   It writes `scene.png` (the whole scene) and `mock.png` (a sidebar and the conversation column drawn over it), and flags a scene that is too long or uses `<filter>` or `<mask>`. Look at both images: nothing with contrast inside the dashed box, every listed element present.
2. Play the motion in a real browser (screenshots taken headless do not advance CSS animation): serve the out folder with `python3 -m http.server` and open `mock.html`, in Claude's built-in browser pane if there is one, at a window about 1.54 wide to 1 high. It shows the sidebar's glass and the conversation column over the scene, as the app does: motion hidden under the sidebar or too faint there is motion the person will not see. Watch long enough for every motion to come round.
3. `claude plugin validate <plugin folder>`. An older terminal build may warn "no component is named Backdrop"; the app's own engine has it.
4. Ask the person to type `/reload-plugins`, then `/backdrop <key>`. It is done once they have seen it in the app.

## Pitfalls

- `<filter>`: the colours change and the picture never shows. Make glow in the medium (stacked paper, tile tones, dot size).
- Animating in white on a light scene: nothing visibly moves. Use warm gold or grey.
- Anthropic's `/custom-theme` re-applies its own theme every turn in a project where one was chosen: run `/custom-theme off` first.
