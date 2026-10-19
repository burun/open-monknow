# Development and testing

## Repository layout

| Path | Responsibility |
| --- | --- |
| `extension/manifest.json` | Manifest V3 entry, permissions, and content security policy |
| `extension/newtab.html`, `styles.css` | Page structure, fluid sizing, themes, and layout |
| `extension/app.js` | UI, interaction, settings, and backup flows |
| `extension/model.js` | Versioned data model, validation, search targets, and movement |
| `extension/storage.js` | Chrome local storage and Web-preview localStorage adapter |
| `extension/site-icons.js` | Domain-to-asset mapping and Chrome favicon resources |
| `extension/assets/` | Local wallpapers, extension mark, and licensed website icons |
| `scripts/` | Local server, checks, packaging, and browser verification |
| `tests/` | Node built-in test runner tests |

## Prerequisites and commands

Node.js 22+ is sufficient for the local server, resource checks, unit tests, and packaging. No `npm install` is needed. Building uses the system `zip` command, available on the Linux CI runner and commonly on macOS; install a compatible zip utility if it is missing.

```sh
npm run dev
npm run check
npm test
npm run build
```

The development server binds only to `127.0.0.1:4173` and serves `extension/` with the extension's resource restrictions. Web-preview localStorage is separate from real extension data. The preview cannot use Chrome's favicon resources.

`npm run build` reads the version from the manifest, copies the extension, installation guide, MIT license, and third-party notices into `dist/open-monknow/`, then creates a versioned ZIP. It also writes a standalone `dist/INSTALL.md` and `dist/SHA256SUMS.txt`. Generated output is ignored by Git. Extract a ZIP before loading it; it is not a signed CRX or an automatic update channel. Version changes should keep `package.json`, manifest, visible version labels, installation guide, and changelog consistent.

## Real browser checks

Use an extension-capable Chromium or Chrome for Testing executable. Some branded Chrome builds ignore command-line extension loading. The browser runner uses Playwright CLI 0.1.22, downloaded by `npm exec` if it is not cached. Browser checks therefore require network access on first use and are separate from the dependency-free core tests.

```sh
CHROMIUM_PATH="/absolute/path/to/chromium" npm run test:browser

# To watch the test browser instead of running headlessly:
CHROMIUM_PATH="/absolute/path/to/chromium" HEADED=1 npm run test:browser
```

Set the equivalent environment variables in your shell on other platforms. The executable must already be installed; this runner does not install a browser or change your daily Chrome profile.

The runner creates a **new isolated profile under `output/playwright/`**, loads this checkout as an unpacked extension, and runs three scripts in order:

1. `browser-smoke.js`: core flows, persistence, two real tabs, backup export/import, search routing, and screenshots.
2. `browser-edge-smoke.js`: deletion confirmation, undo, restored backup persistence, invalid import preservation, and settings.
3. `browser-display-smoke.js`: legacy data, icons, fluid sizing at five viewport widths, manual scale, and offline resources.

It generates the invalid backup fixture from synthetic test data. Search-engine responses are intercepted by test routes, so these checks verify navigation and query encoding rather than live search availability. These scripts clear or replace extension data: **never run them against a personal browser profile**. Profiles, JSON fixtures, screenshots, and full step logs remain in ignored `output/`; remove them when no longer needed. The runner closes only its own browser session.

`output/playwright/overview.png` is a clean screenshot of default content after the tests, suitable for reviewing documentation images. Normal tests do not overwrite the committed README screenshot.

## Storage and compatibility

Data is stored under `open-monknow-v1`, with `version: 1` inside the JSON payload. All loaded and imported data passes `validateState`. Missing newer fields receive defaults. Add fields through that validator and preserve IDs and user content. Backups include settings, groups, links, to-dos, and a local wallpaper. Simultaneous edits currently use the last saved state.

Keep user text escaped or assigned with `textContent`. URL entry points must pass `safeUrl`; only HTTP(S) links are supported. The extension CSP blocks remote script execution and connection APIs. Website icons must be packaged assets or Chrome favicon resources; new third-party files need license records.

## Checks in CI

GitHub Actions runs resource and syntax checks, unit tests, and a build on Node.js 22 and 24 under Linux. The Node.js 24 job uploads the unpacked build as a workflow artifact. It does not publish to a store, create a release, or run the optional browser checks. A local pass does not establish that a newly pushed workflow has completed; inspect the Actions run separately.

## GitHub Releases

The separate `Release` workflow runs when a tag such as `v0.1.1` is pushed. Before tagging, update `docs/installation.md`, add `docs/releases/<tag>.md`, and keep package/manifest versions aligned. Commit and push the source, then create and push an annotated version tag. The tag must match the manifest version; the workflow validates that before building.

The workflow runs checks and unit tests, builds all three attachments, creates a draft, uploads and verifies asset sizes and digests when provided by GitHub, then publishes the release. It uses the workflow's repository-scoped token with `contents: write`; no personal access token is stored in this repository. A retry may resume a draft, but refuses to overwrite a published release. This workflow does not upload to the Chrome Web Store.
