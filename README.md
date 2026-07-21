# jasonjamesweaver.com

Jason Weaver's personal site — a professional home on the internet, built as a
small NES-style adventure. Instead of a conventional nav bar, visitors press
start, watch a pixel-art hero raise his sword, and explore a village world map
where each location opens a section of the site.

Audience: recruiters, hiring managers, future consulting clients, and the
professional network. The goal is authentic and human, not corporate.

## The experience

1. **Title screen** — a `PRESS START` screen. Clicking (or keyboard-activating)
   it plays a short six-frame sword-raise sequence, then enters the world.
2. **Village map** — an interactive world map with five clickable locations.
   Hover/focus reveals a description; a button list beneath provides the same
   navigation on mobile.
3. **World screens** — each location opens a themed pixel-art scene with a copy
   panel and a "Return to Village" action.

| Location        | Section  | Content                                          |
| --------------- | -------- | ------------------------------------------------ |
| Castle          | Status   | Current focus, operating style, direction        |
| Journey         | Career   | Platform operations and leadership history        |
| Blacksmith      | Projects | AI tools, automation, dashboards, experiments    |
| Village Library | Resources| Books, tools, people, and media                  |
| Weaver's House  | Contact  | Email and LinkedIn                               |

Navigation is driven by the URL hash (`#map`, `#status`, `#journey`, etc.), so
locations are deep-linkable. Motion respects `prefers-reduced-motion`: the
sword sequence is skipped and the visitor is taken straight into the world.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- TypeScript
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- Deployed on [Vercel](https://vercel.com)

The entire experience lives in `app/page.tsx` as a single client component;
routing between views is handled in-page via the URL hash rather than separate
routes.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Project structure

```
app/
  layout.tsx        Root layout, fonts, and page metadata
  page.tsx          The full experience: title, map hub, and world screens
  globals.css       Theme, pixel-art rendering, and animation keyframes
public/images/
  nes/              Scene art (WebP): title, village, and the five worlds
  nes/title-scene/  Title-sequence frames, sword-raise frames, and source art
scripts/            Python tooling that builds the title-scene frames
docs/website-vision.md
```

## Images

Scene art is stored as WebP (quality 80) and rendered with
`image-rendering: pixelated` to keep hard pixel edges. Scenes below the fold use
`loading="lazy"`; the title screen is prioritized as the LCP image. The
sword-raise frames are preloaded during browser idle time so the sequence plays
smoothly on click without competing with the initial page load.

### Regenerating the title sequence

The frames under `public/images/nes/title-scene/` are generated from the source
art by two scripts (require Python 3 and Pillow):

```bash
python scripts/build_title_full_frames.py      # builds the title frames
python scripts/build_title_sword_sequence.py   # builds the sword-raise frames
```

Master source art lives in `public/images/nes/title-scene/source/`.

## Deployment

Pushes deploy automatically via Vercel. See the
[Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying)
for details.
