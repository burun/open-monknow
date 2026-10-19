# Third-party icons

The software in this repository is MIT-licensed. Website icons and trademarks retain their own terms; inclusion does not imply endorsement.

## Simple Icons

The selected SVG icons in `extension/assets/sites/` are from [Simple Icons](https://github.com/simple-icons/simple-icons), version 16.35.0 (OpenAI icon: version 14.15.0). They are distributed under CC0-1.0; the included `SIMPLE-ICONS-LICENSE.txt` contains the license. Fill colors were applied for display. Brand names and logos remain trademarks of their respective owners. See the upstream project for brand-specific guidance.

The extension serves these bundled files locally and does not contact an external icon service. Other website icons are displayed through Chrome's favicon resource, under the browser's `favicon` permission.

No Are.na artwork is bundled. Are.na, like any website without a packaged icon, uses Chrome's favicon resource or a text fallback.

The exact file inventory, upstream source/brand-guideline URLs, and package versions are recorded in [`extension/assets/sites/sources.json`](extension/assets/sites/sources.json). The OpenAI source icon is named `openai.svg` upstream and `chatgpt.svg` in this project. All other SVG filenames match upstream.

Package sources:

- Simple Icons 16.35.0: <https://registry.npmjs.org/simple-icons/-/simple-icons-16.35.0.tgz>
- Simple Icons 14.15.0: <https://registry.npmjs.org/simple-icons/-/simple-icons-14.15.0.tgz>

In a built extension, the inventory and CC0 text are under `assets/sites/`; the relative source-tree link above applies to the repository.
