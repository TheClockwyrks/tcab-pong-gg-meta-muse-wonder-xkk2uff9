# Carom

Carom is a top-down paddle duel that runs entirely in the browser. Two paddles face each other across a dark field while a ball ricochets between them, off the top and bottom walls, and off a pair of swaying, spinning obstacles in the middle of the field. Strike the ball while your paddle is moving to add spin and curve its flight. Score by sending the ball past the far edge behind your opponent; first to 11 points, leading by at least 2, wins.

Play Solo against the AI or Versus against a friend on the same keyboard. No backend, no accounts, and no assets to download — everything is drawn and synthesized in code.

## Install

```sh
npm ci
```

## Run in development

```sh
npm run dev
```

Then open the URL Vite prints (by default http://localhost:5173/).

## Production build

```sh
npm run build
```

This type-checks the project and produces the complete static site into `dist/`, with `index.html` at its root. Serve that directory as-is from any static file server.

Other checks:

```sh
npm run typecheck   # npx tsc --noEmit
npm run lint        # eslint
npm run format      # prettier --check
npm test            # vitest with coverage
```

## Controls

| Action | Keys |
| --- | --- |
| Player one (left) up / down | `W` / `S` |
| Player two (right) up / down | `↑` / `↓` |
| Confirm menu item | `Enter` or `Space` |
| Back | `Esc` |
| Pause / resume | `P` or `Esc` |
| Mute | `M` |

In Solo, both `W`/`S` and the arrow keys move your left paddle; the AI controls the right paddle. In Versus, each player uses their own keys. Menus also work with a mouse or touch: hover or tap to select an item, press and release (or land and lift) inside an item to confirm it. On touch screens the engine shows on-screen sliders for the paddles.

**Spin tip:** move your paddle as it strikes the ball. A downward-moving paddle adds positive spin and curves the ball downward; an upward-moving paddle curves it upward. Spin decays over about a second, and wall and obstacle bounces preserve it.

## Showcase

See `showcase/` for the store-page description, screenshots, and a replay of a rally (`showcase/showcase.toml` lists the carousel).
