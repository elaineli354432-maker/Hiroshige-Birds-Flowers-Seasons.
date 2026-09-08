# Final pre-launch checklist and deployment notes

## Verified in this polish pass

- [x] Existing exhibition sections and motion tokens preserved.
- [x] Catalogue entry now describes a data download; Collection explains JSON rather than promising a PDF.
- [x] Wallpaper previews have source dimensions and contained rendering; eight existing exports are unchanged.
- [x] Mobile return and download labels enlarged; tablet wallpaper layout avoids narrow text columns.
- [x] Exhibition share now announces success or failure; cancelling native share remains quiet.
- [x] Non-artwork hashes close detail; direct-link dismissal has a gallery focus fallback.
- [x] TypeScript, changed-file lint and production build passed.

## Release checks still required

- [x] Local Collection responsive review at 375, 390, 430, 768 and 1440 px; 375px artwork detail also checked.
- [ ] Verify native share on a supported mobile device and clipboard fallback over HTTPS.
- [ ] Verify direct artwork URL, previous/next, Escape, focus return and browser Back/Forward on the deployed host.
- [x] Local preview: all eight wallpaper downloads and catalogue return correct file types; repeat on the production host.
- [ ] Run Lighthouse on the final hosted build; no new Lighthouse result was obtained in this pass.
- [ ] Approve the final visual audit on the deployed candidate. Prior Phase 3 score is not a substitute for this gate.

## Deployment

1. Set NEXT_PUBLIC_SITE_URL to the actual HTTPS production origin before building. The existing fallback is localhost; do not ship that OG image origin.
2. Run npm ci, npx tsc --noEmit, and npm run build. On this Windows host native tooling requires execution outside the restricted sandbox.
3. Publish dist/client as static assets. Keep collection.html, artworks/, wallpapers/, downloads/, _next/ and robots.txt intact.
4. Local production preview: npm run start -- --port 3001. Configuration is wrangler.static.jsonc; its compatibility date matches the installed runtime.
5. Test /collection.html and its #wallpapers anchor. Artwork links use /#artwork-012; hash details share exhibition-level OG metadata, not individual artwork previews.
6. Check genuine missing URLs return a suitable 404. Current Wrangler SPA fallback may otherwise return index.html; avoid treating an HTTP 200 alone as proof a download exists.
7. Retain the last working static artifact for rollback. Stop the preview before rebuilding on Windows to avoid locked dist files.

No deployment was performed. Release remains conditional on the unchecked host/device and visual gates above.

## Local production verification — 2026-09-08 follow-up

- PASS: /#artwork-012 opens Camellia Blossoms in Snow; Next updates title and hash to artwork-013.
- PASS: Escape removes the dialog, sets #gallery, and returns focus to an art-card.
- PASS: catalogue and all eight wallpaper URLs return HTTP 200 with application/json or image/jpeg, with expected nonzero sizes.
- PASS: exhibition Share control reports Shared / 已分享 in the available browser. Real-device share target delivery remains unverified.
- PASS: 390px viewport screenshot (375px content area excluding scrollbar) shows readable Collection and wallpaper layouts with full artwork and no horizontal overflow.
- PASS: fresh local production browser logs contain no errors or warnings.
- PASS: subsequent isolated viewport checks confirmed 375, 430, 768 and 1440px widths, with matching document/client widths and no horizontal overflow. Collection and wallpaper viewport screenshots preserve the paper palette, serif hierarchy, quiet rules and complete prints.
- PASS: 375px direct artwork-012 detail shows the complete print, readable bilingual heading, and visible study/close/previous/next controls. Console remains clear.
- Full-page screenshot stitching produced duplicate bands; visual judgments used actual viewport screenshots instead. No page redesign or further code change was needed.
- The existing successful production build remains applicable: this follow-up changes release documentation only. Production origin, real-device sharing, Lighthouse and deployed visual approval remain release gates.

