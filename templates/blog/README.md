# Starlight-N0ct Blog + Docs template

A ready-to-customize Astro Starlight site with a publication area powered by Starlight Blog.

## Development

~~~sh
npm run dev
~~~

## Build

~~~sh
npm run build
npm run preview
~~~

## First edits

1. Update the title, description, and favicon in n0ct.config.mjs.
2. Replace the sample author in integrations.blog.authors.
3. Edit or remove the sample posts in src/content/docs/blog/.
4. Update sidebar topics and docs content under src/content/docs/.
5. Set SITE_URL and BASE_PATH in .env before deployment.

Blog content uses Starlight's docs collection. The generated content config merges blogSchema into docsSchema, so post frontmatter can include authors, date, tags, excerpts, featured status, and cover metadata.

The deploy workflow is in .github/workflows/deploy.yml. Read DEPLOY.md before publishing.
