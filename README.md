# @n0ctanedev/starlight-n0ct

A role-based dark/light theme and integration bundle for [Astro Starlight](https://starlight.astro.build/), based on the N0ctOS visual identity.

- Space Grotesk Variable and Space Mono.
- Role-based dark and light palettes that preserve the original N0ctane four-color identity.
- A single icon button cycles **Auto → Light → Dark**.
- Ion-inspired icon syntax for sidebar labels and footer icons, powered by `astro-icon`.
- Ion-inspired spacing, recursive sidebar navigation and footer links.
- Native Starlight Cards, Steps and FileTree components with gradient surfaces and readable selection states.
- Ten opt-out integrations, configured from one `n0ct.config.mjs` file.
- Reduced-motion support.

## Requirements

- Node.js 22.22+
- Astro 7.2.10 or newer within the 7.x line
- Starlight 0.42.10 or 0.43.x

## Installation

For an existing Astro/Starlight site:

```sh
npm install @n0ctanedev/starlight-n0ct @iconify-json/lucide
```

For a new, deploy-ready documentation project, use the interactive installer:

```sh
npx @n0ctanedev/starlight-n0ct init my-docs
```

It asks for the site URL, base path, sidebar mode, and optional integrations; creates the Astro/Starlight config, content schemas, starter pages, 404 page, and deployment workflow; explicitly adds Lucide; and installs dependencies. Use `--yes` for defaults, `--no-install` to scaffold only, or `--pm pnpm` to select a package manager.

## Quick start

Create `n0ct.config.mjs` beside `astro.config.mjs`:

```js
export default {
  title: 'My Docs',
  description: 'Documentation for my project',
  sidebar: {
    topicDisplay: 'collapsible', // 'list' or 'dropdown' are also available
    topics: [
      { label: 'Guides', id: 'guides', link: '/guides', directory: 'guides' },
      { label: 'Reference', id: 'reference', link: '/reference', directory: 'reference' },
      { label: 'API', id: 'api', link: '/api', autogenerate: false },
    ],
  },
  integrations: {
    announcement: false,
    blog: false,
  },
};
```

Configure Astro:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import n0ctConfig from './n0ct.config.mjs';
import { n0ctane } from '@n0ctanedev/starlight-n0ct';

export default defineConfig({
  integrations: [
    starlight({
      ...n0ctane(n0ctConfig),
    }),
  ],
});
```

`n0ctane()` expands the short config into native Starlight options. Site deployment settings such as `site`, `base`, and `output` remain in Astro's `defineConfig()` because they are Astro settings, not Starlight settings.

### npm 11 install-script approval

The theme repository explicitly allows the `esbuild` postinstall script. npm 11 applies install-script allowlists at the consuming project root, so a documentation site may need this in its own `package.json`:

```json
{
  "allowScripts": { "esbuild": true }
}
```

Alternatively, approve it interactively with `npm install-scripts approve esbuild`. This is needed only when your npm version and configuration block dependency lifecycle scripts.

## Sidebar shorthand

A string topic expands into a title-cased group with automatically generated children. Starlight sidebar groups do not have a separate landing-page link; the directory's `index.mdx` page appears as a generated entry:

```js
sidebar: {
  topics: ['reference'],
}
```

This becomes a Starlight group similar to:

```js
{
  label: 'Reference',
  items: [{ autogenerate: { directory: 'reference' } }],
}
```

Object topics infer their content directory from their link:

```js
sidebar: {
  topics: [
    { label: 'Guides', icon: 'lucide:book-open', link: '/guides' },
    { label: 'Manual', link: '/manual', directory: 'handbook', collapsed: true },
  ],
}
```

Use `autogenerate: false` for a manually authored group or `autogenerate: true` to append generated entries to its manual `items`. `sidebar.extra` appends native Starlight entries. The `icon` shorthand prefixes the label with `[icon-name]`, using the icon syntax documented below.

Set `sidebar.topicDisplay` to one of three presentations:

- `collapsible` (default): uses the snapshot's recursive sidebar structure with native collapsible groups.
- `list`: uses the upstream `starlight-sidebar-topics` topic list above the selected topic's sidebar.
- `dropdown`: uses `starlight-sidebar-topics-dropdown` to render each root topic as a selector above the selected topic's sidebar.

Both plugin-backed modes require each root topic to have a destination: a root `link`, a `directory`, or a manual sidebar item with a destination. `dropdownIcon` is a built-in Starlight icon name used by the upstream topic list/dropdown; `icon` remains the local/Iconify icon shorthand for N0ctane's native collapsible mode. Give topics stable `id` values when assigning otherwise-unlisted pages with the `topic` frontmatter field.

The upstream plugin also accepts route exclusions and custom route-to-topic mappings. N0ctane forwards these through `sidebar.topicOptions`:

```js
sidebar: {
  topicDisplay: 'list',
  topics: [
    { label: 'Guides', id: 'guides', link: '/guides/' },
    { label: 'Reference', id: 'reference', link: '/reference/' },
  ],
  topicOptions: {
    exclude: ['/api/**', '/search'],
    topics: { reference: ['/generated-api/**'] },
  },
},
```

When Blog is enabled, N0ctane automatically excludes the configured Blog route prefix (default `/blog`) so Blog retains its own generated sidebar. The Sidebar Topics plugin runs before Blog's route middleware: regular documentation pages get the selected topic sidebar and Blog can then add its mobile navigation link; generated Blog routes remain under Blog's control. If another plugin generates routes with its own sidebar, add those routes to `topicOptions.exclude` or associate them through `topicOptions.topics`. N0ctane keeps Starlight's native header structure and composes Blog's public `ThemeSelect` and `SiteTitle` components into the corresponding native header slots when Blog is enabled.

Plugin-backed modes take ownership of Starlight's top-level `sidebar` configuration and `Sidebar` component. Do not set `starlight.sidebar` or `starlight.components.Sidebar` when `topicDisplay` is `list` or `dropdown`; use `collapsible` if you want Starlight's native sidebar or need to provide a custom one. `sidebar.extra` is appended to every topic's sidebar in plugin-backed modes.

### Content schema for list/dropdown topics and Blog

The starter and installer use the `topicSchema` extension for pages that are associated by frontmatter. Existing projects importing that schema should add `starlight-sidebar-topics` as a direct dependency:

```sh
npm install starlight-sidebar-topics
```

If you also use Blog frontmatter fields, install `starlight-blog` directly. Merge both extensions into Starlight's existing docs schema (the installer already does this):

```ts src/content.config.ts
import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema';
import { topicSchema } from 'starlight-sidebar-topics/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: (context) => blogSchema(context).merge(topicSchema),
    }),
  }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};
```

For a site that does not use Blog, omit `blogSchema` and extend with `topicSchema` alone. Pages outside a configured topic directory can opt into a topic with `topic: <topic-id>` in frontmatter. The schema is relevant to both `list` and `dropdown` modes; native `collapsible` mode does not use this topic-assignment field.

## Code blocks

A bare filename after the fence language becomes a title tab. Shell-language fences get a terminal-style title bar with window controls, while JavaScript, TypeScript, JSON, YAML, and other fences use the same framed code-card treatment:

```js n0ct.config.mjs
export default { title: 'My Docs' };
```

N0ctane derives syntax colors from your semantic dark/light palette. Regular Expressive Code metadata such as `title=`, line highlighting, and wrapping remains available.

## Icons

N0ctane uses `astro-icon`, following the same convenient icon model as Ion. By default it looks for local SVGs in `src/icons`. Iconify collections can be installed as packages, for example:

```sh
npm install @iconify-json/lucide
```

Then configure:

```js
icons: {
  iconDir: './src/icons',
  include: { lucide: ['*'] },
},
sidebar: {
  topics: [
    { label: 'Guides', icon: 'lucide:book-open', link: '/guides' },
  ],
},
footer: {
  icons: [{ icon: 'lucide:github', link: 'https://github.com/example/project', label: 'GitHub', newTab: true }],
},
```

Sidebar labels and the site title also accept `[icon-name] Label` directly. Lucide is a required peer dependency. Keeping `@iconify-json/lucide` at the consuming Astro project level allows `astro-icon` to discover the collection when the theme supplies its integration. Modern npm versions install peer dependencies automatically. With package managers that do not, install it explicitly: 
```bash
npm install @iconify-json/lucide
```
Additional collections must be installed by the consuming project (for example, `npm install @iconify-json/tabler`). `astro-icon` is also a theme dependency. For a site title icon, set `title: '[lucide:terminal] N0ctOS'`.

## Built-in integrations

All ten integrations are installed with the theme and enabled by default. Set an entry to `false` to disable it or pass the upstream options object to configure it.

| Config key | Package |
|---|---|
| `basePath` | `starlight-base-path` |
| `announcement` | `starlight-announcement` |
| `kbd` | `starlight-kbd` |
| `llmsTxt` | `starlight-llms-txt` |
| `scrollToTop` | `starlight-scroll-to-top` |
| `llmActions` | `starlight-llm-actions` |
| `sidebarSwipe` | `starlight-sidebar-swipe` |
| `linksValidator` | `starlight-links-validator` |
| `blog` | `starlight-blog` |
| `imageZoom` | `starlight-image-zoom` |

Example:

```js
integrations: {
  basePath:{},
  announcement: { announcements: [{ content: 'Welcome!' }] },
  scrollToTop: { smoothScroll: true, position: 'right' },
  llmsTxt: {},
  llmActions: {},
}
```

The dedicated `llmsTxt` plugin owns site-level indexes by default. To use the LLM Actions plugin for those indexes instead, set `llmsTxt: false`; N0ctane then enables `llmActions.llmsTxt` by default. Enabling both generators at once is rejected to prevent duplicate output routes. Each integration's options are forwarded to its upstream plugin; consult the linked upstream documentation for the exact option schema.

## Documentation versioning

N0ctane delegates documentation versioning to the upstream [`starlight-versions`](https://starlight-versions.vercel.app/) plugin. Its upstream `VersionSelect` component is rendered at the top of the recursive sidebar; the native Starlight header keeps only the theme toggle and site title. Configure its native options in `n0ct.config.mjs`:

```js
versioning: {
  versions: [{ slug: '1.0', label: 'v1.0' }],
  current: { label: 'Latest' },
  exclude: ['blog/**'],
},
```

The plugin archives the current docs into a missing version directory on the next `astro dev` or `astro build`. Add one new version at a time and let the plugin create its snapshot before configuring another. `versions` entries support `slug`, `label`, and `redirect`; `current` supports `label` and `redirect`; `exclude` accepts source-file glob patterns relative to `src/content/docs/`. Set `versioning: false` or omit the property to disable it.

The project's `src/content.config.ts` must register `versions: defineCollection({ loader: docsVersionsLoader() })` from `starlight-versions/loader`. The N0ctane starter includes this collection and the installer can configure an initial archived version.

## Custom components

Use Starlight's built-in components in MDX:

```mdx
import { Steps, FileTree } from '@astrojs/starlight/components';

<Steps>
  1. Install the dependencies.
  2. Run the dev server.
  3. Build the site.
</Steps>

<FileTree>
- src/
  - components/
    - **Sidebar.astro**
  - styles/
    - global.css
</FileTree>
```

The theme styles these native components instead of replacing their Markdown/MDX API. A custom `Callout` is also available:

```mdx
import Callout from '@n0ctanedev/starlight-n0ct/components/Callout.astro';

<Callout type="tip" title="Pro tip">
  Start with the defaults and customize only what you need.
</Callout>
```

Supported callout types: `note`, `tip`, `warning`, `danger`, `info`.

## Advanced Starlight configuration

Anything not simplified by N0ctane can be passed through the `starlight` property. It is merged after theme defaults; user-provided native `components`, `customCss`, `sidebar`, and `plugins` can intentionally override or extend those defaults.

```js
export default {
  title: 'Project Docs',
  sidebar: { topics: ['guides'] },
  starlight: {
    editLink: { baseUrl: 'https://github.com/example/project/edit/main/' },
    lastUpdated: true,
    tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
  },
};
```

## Editor IntelliSense

Keep `n0ct.config.mjs` as JavaScript and add `// @ts-check` plus a JSDoc `@satisfies` annotation referencing `N0ctConfig` to enable autocomplete, hover documentation, and type diagnostics. New projects generated by `npx @n0ctanedev/starlight-n0ct init` include this automatically. See the [configuration reference](docs/src/content/docs/reference/config-api.mdx).

## Development

```sh
npm install
npm run check
npm run docs:dev
```

`npm run check:all` also audits both full dependency trees and builds the documentation demo. It stops for any audit finding, including low-severity advisories. The demo uses a local `file:..` dependency to test the package before publication.

## Publishing

The GitHub Actions release workflow is manually triggered and supports a dry run. Configure npm trusted publishing for this GitHub repository and workflow before publishing. GitHub Pages deployment is configured separately by `.github/workflows/docs.yml`. See [`PREPUBLISH.md`](./PREPUBLISH.md) for the repository setup and release checklist.

## License

MIT. See [LICENSE](./LICENSE).
