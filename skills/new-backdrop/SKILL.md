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

1. Look at the reference and **write down its recognisable elements** and main colours. The reference's own frame (letterbox bars, subtitles, watermarks) is not an element.
2. Decide, and tell the person in a few lines before drawing:
   - **which medium**: tiles, cut paper, dots or flat colour, and why it suits this picture;
   - **which way**: redraw (draw the elements yourself in the medium) or trace (trace the picture into flat colour with `tools/trace.py`). Suggest tracing when a figure has to look like the picture; the other media cannot draw a recognisable face;
   - **where it lives**, if tracing: ask where the picture comes from. The person's own photo or drawing, or material free to use: the scene may go in `hooks/` and be shared. Someone else's artwork (an anime frame, a film still): the scene goes in `private/` only and never into a public repository;
   - which strip holds the subject (right, x 1250–1600, or left, x 233–432 where it is seen) and what had to move to keep x 432–1250 clear;
   - light or dark window.
3. Learn the medium from working examples:
   - this plugin's `hooks/scene.ts` (tiles), `hooks/moon.ts` (cut paper), `hooks/crossing.ts` (dots), and `tools/trace.py` (flat colour, traced);
   - Anthropic's `theme-examples` plugin, if installed, under `~/.claude/plugins/cache/claude-plugins-official/theme-examples/<version>/hooks/scenes/`: `koi-mosaic.ts` (tiles), `paper-garden.ts` (cut paper), `braille-stars.ts`, `departure-board.ts`, `halftone-dawn.ts` (dots).

## 2. Draw

### Redraw, or trace a picture that may be shared

1. Write the scene as `hooks/<name>.ts`, exporting one function that returns the SVG string. Pure string building, the same output every call, no imports from outside. Open it with a comment: the elements kept, what moved, the medium, what moves. A traced scene is generated: keep its build script beside it and say so in that comment.
2. Add an entry to `LOOKS` in `hooks/looks.ts`: `key` (what follows `/backdrop`), `scene`, a title, a one-line blurb, `window`, colours from `makeColors` (add `only: 'dark'` for a dark scene), `glass`, `svg`, `alt`.

### Trace someone else's artwork (private)

1. Make a folder `private/<name>/` with the reference picture and a build script that calls `trace_picture` from `tools/trace.py`. Useful settings: `rois` for a finer pass over a figure (it gets colours of its own: hair, skin), `flat` to fill the conversation column with the ground colour before tracing (saves characters), and a ground-coloured gradient over x 432–1250 in the scene so the picture fades out there.
2. The build script writes `private/<name>/scene.svg`: the traced regions, the fade, and the motion as vector shapes on top (no embedded image).
3. Add an entry to `private/looks.json`: `key`, `scene`, `title`, `blurb`, `window`, `glass`, `svg` (the file, relative to `private/`), `alt`, `roles` and `anchors` (the colours `makeColors` takes). `private/` is in `.gitignore`; check with `git status` that nothing in it is staged.
4. `/backdrop` reads `private/looks.json` each time it runs, so no reload is needed for a private scene; the app draws a changed scene again because its name carries a fingerprint of the drawing.

## 3. Check

1. Preview a scene in `hooks/`, from the plugin folder:
   ```bash
   node tools/preview.mts hooks/<name>.ts <export name> <light|dark> <out folder>
   ```
   It writes `scene.png` (the whole scene) and `mock.png` (a sidebar and the conversation column drawn over it), and flags a scene that is too long or uses `<filter>` or `<mask>`. For a private scene, open its `scene.svg` the same way inside a page that draws the sidebar and the column over it. Look at both: nothing with contrast inside the column, every listed element present, a figure still recognisable.
2. Play the motion in a real browser (screenshots taken headless do not advance CSS animation): serve the out folder with `python3 -m http.server` and open `mock.html`, in Claude's built-in browser pane if there is one, at a window about 1.54 wide to 1 high. It shows the sidebar's glass and the conversation column over the scene, as the app does: motion hidden under the sidebar or too faint there is motion the person will not see. Watch long enough for every motion to come round.
3. `claude plugin validate <plugin folder>`. An older terminal build may warn "no component is named Backdrop"; the app's own engine has it.
4. Ask the person to type `/reload-plugins` (for a scene in `hooks/`), then `/backdrop <key>`. It is done once they have seen it in the app, moving.

## Pitfalls

- `<filter>`: the colours change and the picture never shows. Make glow in the medium (stacked paper, tile tones, dot size).
- An embedded raster `<image>`: the picture shows, but every animation in the scene stops. Trace it instead.
- Animating in white on a light scene, or under the sidebar (x < 233): nothing visibly moves. Use warm gold or grey, inside the seen strips.
- Big sweeps of light or shadow over a traced picture tend to jar; dust or small specks sit better.
- Anthropic's `/custom-theme` re-applies its own theme every turn in a project where one was chosen: run `/custom-theme off` first.
