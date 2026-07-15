# Bing Photo of the Day

A tiny [Next.js](https://nextjs.org) app that displays Bing's daily "Image of the
Day" full-screen, with an optional, fully-configurable caption (Bing's title and
photo credit). The display is driven entirely by URL parameters, and a built-in
[`/playground`](#playground) lets you dial in a look and copy the URL to use.

## How it works

The home page (`/`) fetches Bing's image-archive endpoint server-side and renders
the photo edge-to-edge. Everything about the optional caption overlay is
controlled through the query string, so a single deployment can serve many
different looks (e.g. as a background for a dashboard, a kiosk, a browser
new-tab page, etc.).

### URL parameters

All parameters are optional. With no query string, the photo is shown bare.

| Param     | Values              | Default | Description                                    |
| --------- | ------------------- | ------- | ---------------------------------------------- |
| `caption` | `true`              | off     | Show the caption (any other value hides it).   |
| `pos`     | `br` `bl` `tr` `tl` | `br`    | Which corner the caption anchors to.           |
| `x`       | `0`–`200` (px)      | `8`     | Distance from the left/right edge.             |
| `y`       | `0`–`200` (px)      | `8`     | Distance from the top/bottom edge.             |
| `wrap`    | `true`              | off     | Allow the caption to wrap onto multiple lines. |

> `copyright=true` is accepted as a legacy alias for `caption=true`.

**Examples**

```
/                                     # photo only
/?caption=true                        # caption, bottom-right, 8px inset
/?caption=true&pos=tl&x=40&y=24       # top-left, custom offsets
/?caption=true&wrap=true              # allow long captions to wrap
```

The parsing/validation and placement logic live in one shared module,
[`src/lib/caption.ts`](src/lib/caption.ts), so the live page and the playground
always render identically.

### Playground

Visit [`/playground`](http://localhost:3000/playground) for an interactive
configurator: toggle the caption, pick a corner, drag the offset sliders, and
preview against today's real photo. It shows the exact URL to copy and offers a
timed full-screen preview of the final result. It's also self-documenting — the
same settings map directly to the parameters above.

### Staying fresh

Nobody publishes exactly when Bing rolls the photo over, so freshness is handled
in two layers (see [`src/lib/bing.ts`](src/lib/bing.ts) and
[`src/app/api/revalidate/route.ts`](src/app/api/revalidate/route.ts)):

- **15-minute Data Cache window** on the Bing fetch — the primary mechanism.
  It's rollover- and timezone-agnostic; worst-case staleness is one window.
- **Daily cron backstop** (`vercel.json`) that hits `/api/revalidate` so the
  first visitor after a long idle gap never gets a day-old photo. The cron is
  authenticated with a `CRON_SECRET` bearer token.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, deployed on **Vercel**
- **Tailwind CSS v4**
- **shadcn/ui** on the **Base UI** primitives (`base-maia` style) — components
  are vendored into [`src/components/ui/`](src/components/ui) and tracked by a
  small manifest (see [Vendored components](#vendored-components))
- Fonts via `next/font`: **Manrope** for UI (`--font-sans`), **Inter** for the
  caption (`--font-caption`)
- `@vercel/analytics`

## Getting started

```bash
yarn install
yarn dev            # http://localhost:3000
```

### Scripts

| Script                        | Description                             |
| ----------------------------- | --------------------------------------- |
| `yarn dev`                    | Start the dev server                    |
| `yarn build` / `yarn start`   | Production build / serve                |
| `yarn type-check`             | `tsc --noEmit`                          |
| `yarn lint`                   | ESLint                                  |
| `yarn format`                 | Prettier write                          |
| `yarn vendor-components:list` | List tracked vendored UI components     |
| `yarn vendor-components:sync` | Re-pull vendored components from shadcn |

## Environment

| Variable      | Where           | Purpose                                         |
| ------------- | --------------- | ----------------------------------------------- |
| `CRON_SECRET` | Vercel / `.env` | Bearer token that authorizes `/api/revalidate`. |

## Project structure

```
src/
  app/
    page.tsx                 # live full-screen photo (reads URL params)
    layout.tsx               # fonts + providers
    playground/              # interactive configurator (/playground)
    api/revalidate/route.ts  # cron-authenticated revalidation endpoint
  components/
    caption.tsx              # shared caption overlay
    ui/                      # vendored shadcn/Base UI components
  lib/
    bing.ts                  # Bing image-archive data access + caching
    caption.ts               # URL-param contract + placement logic
    utils.ts                 # cn()
```

### Vendored components

shadcn components are copied into the repo rather than installed as a package.
[`vendor-components.json`](vendor-components.json) tracks which ones we own, and
[`scripts/vendor-components.mjs`](scripts/vendor-components.mjs) can `list`,
`discover`, and `sync` them. They're excluded from linting/formatting since they
aren't hand-authored.

## License

MIT © wheredoesyourmindgo
