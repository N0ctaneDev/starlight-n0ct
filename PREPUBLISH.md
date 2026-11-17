# Release and publishing checklist

This repository is configured for **`n0ctanedev/starlight-n0ct`** and the npm package **`@n0ctanedev/starlight-n0ct`**.

## 1. Verify the package scope

The npm scope must belong to the account or organization `n0ctanedev`. Check availability and authentication before first publish:

```sh
npm whoami
npm view @n0ctanedev/starlight-n0ct name
```

A 404 means the package has not been published yet; it does not reserve the name.

## 2. Install and validate

Use Node.js 22.22 or newer and npm 11.5.1 or newer (required for the repository install-script allowlist and npm trusted publishing flow). The repository and demo app include an npm `allowScripts` entry for `esbuild`, because its postinstall selects the platform-specific binary used by Astro/Vite. npm 11 uses this setting to permit that dependency script in this repository. When installing the theme into a separate documentation project, that consuming project may also need `"allowScripts": { "esbuild": true }` in its own `package.json`, or to approve it interactively with `npm install-scripts approve esbuild`.

```sh
npm install
npm run check:all
npm run audit:full
npm pack --dry-run
```

`npm audit` is run against the complete resolved dependency tree at low severity and above. The full audit is part of `check:all`, so CI and publishing will stop on any reported low, moderate, high, or critical vulnerability. The source repository does not commit a lockfile because this is a reusable library package; the CI install creates a temporary lockfile for each run. For repeatable local triage, keep your generated `package-lock.json` while investigating the dependency tree and advisories. The `esbuild` override selects a patched 0.28.x release rather than vulnerable 0.27.x builds. Do not run `npm audit fix --force` blindly; it may introduce breaking upgrades. The publishing workflow intentionally does not suppress critical audit findings: review and remediate the specific affected package paths before release.

## 3. Push to GitHub

```sh
git init -b main
git add .
git commit -m "chore: prepare @n0ctanedev/starlight-n0ct 0.1.4"
git remote add origin https://github.com/n0ctanedev/starlight-n0ct.git
git push -u origin main
```

Enable GitHub Pages with **GitHub Actions** as the source. The published demo is configured for `https://n0ctanedev.github.io/starlight-n0ct/`.

## 4. Configure npm trusted publishing

On npm, configure a trusted publisher for `@n0ctanedev/starlight-n0ct`:

- Provider: GitHub Actions
- Owner: `n0ctanedev`
- Repository: `starlight-n0ct`
- Workflow filename: `publish.yml`
- Environment: not set (the workflow does not specify a GitHub environment)

The release workflow uses OIDC provenance and public scoped publishing. It does not require a long-lived npm token.

## 5. Release

Update `version` in `package.json`, add a changelog entry, merge to `main`, then run **Publish to npm** with `dry_run: true`. Review the package contents. Run again with `dry_run: false` to publish.

The workflow runs the package checks, production dependency audit, demo-site build and npm pack validation before publishing. Never publish while the full dependency audit reports unresolved vulnerabilities.
