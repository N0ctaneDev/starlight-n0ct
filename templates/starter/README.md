# N0ctane documentation starter

This is a deploy-ready Astro Starlight project scaffolded by `npx @n0ctanedev/starlight-n0ct init`.

## Development

```sh
npm run dev
```

## Production build

```sh
npm run build
npm run preview
```

## Project configuration

- `astro.config.mjs`: Astro site URL, base path, and Starlight/N0ctane integration.
- `n0ct.config.mjs`: theme, sidebar, and optional plugin configuration.
- `src/content.config.ts`: Starlight docs/i18n schemas extended with Blog and Sidebar Topics frontmatter, plus the Starlight Versions collection loader.
- `src/content/docs/blog/`: working example posts powered by Starlight Blog.
- `src/content/docs/reference/components.mdx`: interactive-looking component showcase using native Starlight and N0ctane components.
- `src/content/docs/`: starter pages and the custom 404 page.
- `DEPLOY.md`: GitHub Pages and generic static-host deployment instructions.

Lucide is installed directly in this site's dependencies so `astro-icon` can discover its Iconify collection. Vite is also a direct development dependency because the Astro config uses `loadEnv()` to read `.env` values.
