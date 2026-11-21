# Starlight-N0ct documentation starter

A clean Astro Starlight documentation project using Starlight-N0ct.

## Development

~~~sh
npm run dev
~~~

## Production build

~~~sh
npm run build
npm run preview
~~~

## First edits

1. Update the title, description, favicon, and sidebar in n0ct.config.mjs.
2. Replace the sample pages under src/content/docs/.
3. Set SITE_URL and BASE_PATH in .env.
4. Read DEPLOY.md before publishing.

The starter includes Starlight docs and i18n collections, the Sidebar Topics schema, the Blog schema so Blog can be enabled later, and the Versions loader for optional documentation archives. Blog itself is disabled by default. Add it later without recreating the project:

~~~sh
npx @n0ctanedev/starlight-n0ct add blog
npx @n0ctanedev/starlight-n0ct add versioning
~~~

The Blog command asks for its URL prefix/content directory and creates a first post. Choose the separate Blog + Documentation template when you want a publication configured and populated from the start.

Lucide is installed directly so astro-icon can resolve the bundled collection. Vite is a direct development dependency because astro.config.mjs uses loadEnv().
