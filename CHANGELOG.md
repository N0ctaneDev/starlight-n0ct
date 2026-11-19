# Changelog

## 1.0.0

First stable release of N0ctane for Astro Starlight.

- Rework the documentation information architecture and add dedicated component references with usage and CSS hooks.
- Replace the theme playground with a focused editor, live component preview, reset controls, and copyable configuration.
- Add keyboard-driven installer menus for template and integration selection, with descriptions for every optional integration.
- Add a dedicated Blog + Documentation template alongside the general documentation starter.
- Add global and per-theme favicon selection, matching footer branding, and palette-aware brand gradients.
- Compose LLM Page Actions with Starlight Versions so both page features can render together.
- Refresh the README, screenshots section, homepage, and release metadata.

## 0.2.0

- Add stable mode-qualified color tokens such as `--n0ct-dark-base` and `--n0ct-light-surface`.
- Add independent dark and light syntax palettes through `theme.colors.*.codePalette`, sharing the resolver with UI colors.
- Improve default light/dark documentation contrast, badges, heading accents, and code-frame styling.
- Remove the standalone Command component in favor of standard Expressive Code fences.
- Restore macOS-style terminal title-bar dots, remove the extra copy button, and clean up duplicate code-frame outlines.
- Expand the demo with active blog, versioning, announcement, keyboard, image zoom, and showcase content.
- Bump the package version to 0.2.0.

## 0.1.4

- Normalize version matching when deployed with or without trailing slashes and verify the Astro base-path boundary.
- Gate CI and publishing on the full root and demo dependency audits at low severity and above.
- Bump the package patch version after the compatibility and release-pipeline fixes.

## 0.1.3

- Force the patched esbuild 0.28.x line to avoid the reported vulnerable 0.27.7 build.
- Add a production dependency audit gate to the full validation command and release workflows.
- Insert generated theme tokens before project custom CSS so user overrides retain precedence.
- Trim and validate sidebar/version labels; reject duplicate historical version labels.
- Validate footer and sidebar URLs to reject unsafe schemes and malformed path inputs.
- Update Lucide collection dependency and npm install-script guidance.
- Tighten release documentation and package metadata.

## 0.1.2

- Fix strict TypeScript resolution around Starlight plugin package source declarations.
- Preserve native Starlight sidebar restore markers in the custom sidebar renderer.
- Correct sidebar topic expansion to emit only native Starlight group/link shapes.
- Keep theme cycling compatible with Starlight 0.43's ThemeProvider.
- Preserve native Starlight sidebar group restore markers and reject duplicate version paths.
- Update package and repository metadata to `@n0ctanedev/starlight-n0ct`.

## 0.1.1

- Rename the package to `@n0ctanedev/starlight-n0ct`.
- Align GitHub metadata and demo deployment with `n0ctanedev/starlight-n0ct`.
- Fix strict TypeScript checking of upstream plugin source exports with isolated plugin type shims.
- Type the generated Starlight config and Expressive Code options explicitly.
- Improve normalized sidebar typing and config validation.
- Approve the esbuild install script through npm's project `allowScripts` policy.
- Bundle the Lucide Iconify collection as a runtime dependency and enable it by default.

## 0.1.0

- Initial N0ctane theme package scaffold.
- Add Space Grotesk and Space Mono typography.
- Add neon purple/blue theme tokens and reduced-motion support.
- Add Starlight component overrides, version selector, icon-aware sidebar and custom callout.
- Add concise `n0ct.config.mjs` expansion and nine configurable Starlight plugins.
- Add demo documentation and GitHub workflows.

