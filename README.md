<div align="center">

# Starlight-N0ct

**A full-featured visual system, component kit, and project installer for Astro Starlight.**

A carefully tuned docs experience with named themes, genuinely independent light and dark palettes, beautiful code frames, reusable components, and optional Starlight integrations.

[![npm version](https://img.shields.io/npm/v/@n0ctanedev/starlight-n0ct?label=npm&color=cb4bdb)](https://www.npmjs.com/package/@n0ctanedev/starlight-n0ct)
[![npm downloads](https://img.shields.io/npm/dm/@n0ctanedev/starlight-n0ct?label=downloads&color=8657e8)](https://www.npmjs.com/package/@n0ctanedev/starlight-n0ct)
[![GitHub stars](https://img.shields.io/github/stars/n0ctanedev/starlight-n0ct?style=flat&color=21c5d8)](https://github.com/n0ctanedev/starlight-n0ct/stargazers)
[![Last commit](https://img.shields.io/github/last-commit/n0ctanedev/starlight-n0ct?label=updated)](https://github.com/n0ctanedev/starlight-n0ct/commits/main)
[![CI](https://github.com/n0ctanedev/starlight-n0ct/actions/workflows/ci.yml/badge.svg)](https://github.com/n0ctanedev/starlight-n0ct/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/n0ctanedev/starlight-n0ct)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D22.22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

[Documentation](https://n0ctanedev.github.io/starlight-n0ct/) · [npm package](https://www.npmjs.com/package/@n0ctanedev/starlight-n0ct) · [Report an issue](https://github.com/n0ctanedev/starlight-n0ct/issues)

</div>

---

## Screenshots

Full-width product shots will live in /assets. Add your screenshots as 1.png, 2.png, 3.png, and so on; each image is intentionally displayed on its own row.

<p align="center"><img src="assets/1.png" alt="Starlight-N0ct documentation homepage" width="100%"></p>

<p align="center"><img src="assets/2.png" alt="Starlight-N0ct theme playground" width="100%"></p>

<p align="center"><img src="assets/3.png" alt="Starlight-N0ct component documentation" width="100%"></p>

<p align="center"><img src="assets/4.png" alt="Starlight-N0ct code frames and tabs" width="100%"></p>

<p align="center"><img src="assets/5.png" alt="Starlight-N0ct light appearance" width="100%"></p>

---

## Why Starlight-N0ct?

Starlight-N0ct (N0ctane) gives Astro Starlight a coherent visual language without replacing the underlying documentation platform. It keeps Starlight's content model, navigation, accessibility conventions, and component ecosystem, while adding a theme system and a set of practical project tools.

- **Named themes, two modes.** Visitors choose a palette and independently choose Dark or Light. Both modes are authored separately.
- **A real design-token system.** Palette colors resolve into surfaces, text, borders, focus states, semantic colors, code colors, gradients, shadows, and Tailwind utilities.
- **Code frames that feel native.** Expressive Code retains copy controls, titles, terminal frames, syntax highlighting, line focus, diffs, and interactive code tabs.
- **Reusable documentation components.** Callouts, link cards, grids, file trees, keyboard keycaps, and step lists share the active theme.
- **Useful integrations.** Enable blog, image zoom, LLM page actions, Markdown indexes, keyboard helpers, swipe navigation, link validation, announcements, and scroll-to-top.
- **A project installer.** Generate a documentation site or a blog + documentation site, choose integrations with a keyboard menu, and install with npm, pnpm, yarn, or bun.

## Get started

### Option A — use the interactive installer

~~~sh
npx @n0ctanedev/starlight-n0ct init my-docs
~~~

The installer asks for the project details, then opens keyboard-driven selectors for the template and optional integrations. Base-path rewriting is preselected when you configure a subpath deployment.

| Key | Action |
|---|---|
| ↑ / ↓ | Move through the list |
| Space | Toggle an integration |
| Enter | Confirm the selection |
| A / N | Select all / clear all integrations |

Choose one of the included templates:

- **Documentation starter** — a clean docs site with guides and reference pages.
- **Blog + documentation** — the same foundation with Blog enabled, author metadata, and example posts.

The installer also supports non-interactive setups:

~~~sh
# Recommended starter defaults
npx @n0ctanedev/starlight-n0ct init my-docs --yes

# Choose the blog template explicitly
npx @n0ctanedev/starlight-n0ct init my-blog --template blog --yes

# Scaffold only; install dependencies later
npx @n0ctanedev/starlight-n0ct init my-docs --no-install

# Choose a package manager
npx @n0ctanedev/starlight-n0ct init my-docs --pm pnpm
~~~

### Option B — add it to an existing Starlight project

Install the theme and Lucide collection:

~~~sh
npm install @n0ctanedev/starlight-n0ct @iconify-json/lucide
~~~

Create n0ct.config.mjs:

~~~js
// @ts-check

/** @satisfies {import('@n0ctanedev/starlight-n0ct').N0ctConfig} */
const config = {
  title: 'Project documentation',
  description: 'Documentation for my project.',
  favicon: '/favicon.svg',

  sidebar: {
    topicDisplay: 'collapsible',
    topics: ['guides', 'reference'],
  },

  integrations: {
    blog: false,
    llmsTxt: {},
    scrollToTop: {},
  },

  theme: {
    defaultTheme: 'n0ctane',
    themes: {
      n0ctane: {
        label: 'N0ctane',
        colors: {
          dark: {
            palette: {
              primary: '#F25CFF',
              secondary: '#8C42FF',
              accent: '#00E5FF',
              surface: '#131626',
              text: '#E6EAF8',
            },
          },
          light: {
            palette: {
              primary: '#B72DBF',
              secondary: '#7540CE',
              accent: '#00AFC2',
              surface: '#FFFFFF',
              text: '#211D32',
            },
          },
        },
      },
    },
  },
};

export default config;
~~~

Connect it in astro.config.mjs:

~~~js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import n0ctConfig from './n0ct.config.mjs';
import { n0ctane } from '@n0ctanedev/starlight-n0ct';

export default defineConfig({
  integrations: [
    starlight(n0ctane(n0ctConfig)),
  ],
});
~~~

Start the development server:

~~~sh
npm run dev
~~~

## Theme system

A theme is a named palette with independent dark and light definitions. The active palette and appearance mode are kept separate, so switching from GitHub Dark to GitHub Light does not change the selected palette.

The built-in demo includes **N0ctane, GitHub, Catppuccin, Rosé Pine, Dracula, Nord, and Flexoki**.

Each mode can define:

- Core palette colors: primary, secondary, accent, surface, text, plus optional highlight and background colors.
- An independent syntax palette for Expressive Code.
- Semantic status colors: success, warning, danger, and info.
- Fine-grained overrides for surfaces, text, borders, interactive states, highlights, and code frames.
- Brand gradients, additional gradients, and shadows.

The optional favicon on the root config is the fallback. A named theme can set theme.themes.<id>.favicon to replace it; the browser icon and footer brand mark follow the active theme.

See the [theme reference](https://n0ctanedev.github.io/starlight-n0ct/reference/theme/) and use the live [theme playground](https://n0ctanedev.github.io/starlight-n0ct/reference/theme/#live-theme-playground) to edit a palette and copy its configuration.

## Components

The package includes reusable MDX/Astro components:

| Component | Purpose |
|---|---|
| Callout | Semantic note, tip, warning, danger, and info panels |
| DocCard | Linked or static documentation card |
| DocGrid | Responsive grid for documentation cards and content |
| FileTree | N0ctane-styled wrapper around Starlight's FileTree |
| Kbd | Themed keyboard keycap |
| Steps | Starlight's accessible numbered step list with N0ctane styling |
| Step | Lightweight list-item helper for composed step content |

Detailed examples, component props, and CSS hooks are in the [component documentation](https://n0ctanedev.github.io/starlight-n0ct/components/).

## Included integrations

The integrations below can be enabled with an empty object, disabled with false, or configured with their native upstream options. The versioning option is configured separately.

| Config key | What it adds |
|---|---|
| basePath | Prefixes root-relative content links using Astro's configured base path |
| announcement | Announcement banner |
| kbd | Keyboard shortcut notation and keycap rendering |
| llmsTxt | LLM-friendly documentation index files |
| scrollToTop | Floating scroll-to-top control |
| llmActions | Copy/view Markdown, PDF printing, and open-in-LLM page actions |
| sidebarSwipe | Touch-swipe sidebar navigation |
| linksValidator | Build-time internal link checks |
| blog | Posts, author pages, tags, RSS, and reading metrics |
| imageZoom | Accessible image zoom |

See the [integration guide](https://n0ctanedev.github.io/starlight-n0ct/guides/integrations/) for configuration examples and upstream references.

## Requirements

- Node.js **22.22.0 or newer**
- Astro **7.2.10 or newer** (Astro 7)
- Astro Starlight **0.42.0 or newer**, before 1.0

The package uses npm's allowScripts policy for esbuild. On npm versions that enforce install-script approval, the consuming project may need:

~~~json
{
  "allowScripts": {
    "esbuild": true
  }
}
~~~

## Development

Clone the repository and install dependencies:

~~~sh
git clone https://github.com/n0ctanedev/starlight-n0ct.git
cd starlight-n0ct
npm install
~~~

Useful commands:

| Command | Purpose |
|---|---|
| npm run typecheck | TypeScript checks |
| npm test | Unit and integration tests |
| npm run build | Build package assets |
| npm run docs:dev | Build the package, install docs dependencies, and start the demo |
| npm run docs:build | Build package and demo documentation |
| npm run check:all | Typecheck, tests, package build, docs build, and dependency audit |
| npm pack --dry-run | Inspect the publishable package contents |

## Contributing

Bug reports, improvements, and documentation fixes are welcome. Please open an issue before proposing a significant API change, and run npm run check:all before submitting a pull request.

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">

**Built with Starlight-N0ct · N0ctane._.Dev**

[GitHub](https://github.com/n0ctanedev) · [Repository](https://github.com/n0ctanedev/starlight-n0ct)

</div>
