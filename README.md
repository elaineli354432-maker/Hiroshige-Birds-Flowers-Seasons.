# Hiroshige — Birds, Flowers, Seasons

歌川广重：花鸟与四时 · Phase 1

## Run

Node.js 22.13+ is required.

```sh
npm ci
npm run dev
```

Production: `npm run build`. The Sites scaffold uses React and Vinext/Vite and exports static HTML/assets to `dist/client`. Only that public directory is deployed. Run `npm run lint -- app` for application checks; the unmodified scaffold components have existing full-project lint findings. On Windows, the build preloader permits natural successful process shutdown after prerendering and preserves failure exits.

## Contents

- `app/exhibition.tsx`: hero, seasonal navigation, filters, gallery and accessible artwork dialog.
- `app/catalog.json`: unchanged supplied catalogue with all 114 independent records.
- `app/image-sizes.json`: original dimensions for stable responsive image frames.
- `public/artworks/`: all 114 supplied JPEGs, byte-for-byte unchanged.
- `app/globals.css`: paper and ink palette, serif typography, restrained motion and responsive layouts.

Season and subject filters intersect. All seasons retains works without a specified season. Same-title editions stay separate using their IDs. The dialog navigates within the current filtered set, wraps at either end, supports Escape, restores focus and allows image enlargement. Download, wallpaper and sharing are deliberately disabled Phase 1 placeholders.

Classification and blurbs are the supplied curatorial editing, not verified historical claims. Historical date and publisher fields render only when supplied. Catalogue source: https://www.hiroshige.org.uk/Nature_Prints/Nature_ChuTanzaku.htm

Phase 2 seasonal scrolling and Phase 3 downloads/sharing have not been implemented.

