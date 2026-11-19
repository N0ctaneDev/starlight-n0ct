# Deploying your Starlight-N0ct documentation

The starter builds a static Astro site into `dist/`. Set the canonical site URL and base path before building.

## GitHub Pages

The project includes `.github/workflows/deploy.yml`. Push the project to a GitHub repository, then:

1. Open **Settings → Pages**.
2. Set the build and deployment source to **GitHub Actions**.
3. Push to the `main` branch or run the workflow manually.

The workflow detects npm, pnpm, Yarn, or Bun from the lockfile, then derives `SITE_URL` and `BASE_PATH` from the repository:

- User or organization site (`owner.github.io`): the base path is `/`.
- Project site (`owner.github.io/repository`): the base path is `/repository`.

When the installer is given a non-root base path, it preselects the Base path rewriting integration. You can disable it in `n0ct.config.mjs` if you handle root-relative links another way.

## Other static hosts

Run:

~~~sh
npm run build
~~~

Publish the generated `dist/` directory. Configure your host's build settings with:

- Build command: `npm run build`
- Output directory: `dist`
- Node.js: `22.22` or newer

For a subpath deployment, set `SITE_URL` and `BASE_PATH` in the host's build environment. Keep the same values in local `.env` when testing the deployment build.
