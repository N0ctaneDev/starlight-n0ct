import icon from 'astro-icon';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { N0ctConfig } from './types.js';
import { createRemarkCodeFilenamesIntegration } from './remark-code-filenames.js';

const isHex = (value: string) => /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value);
const safeLength = (value: string) => {
  const match = /^(\d+(?:\.\d+)?)(px|rem|em|vw|vh|%)$/.exec(value);
  return Boolean(match && Number(match[1]) > 0);
};

function tokenStyles(config: N0ctConfig) {
  const theme = config.theme ?? {};
  for (const [key, value] of Object.entries({ accent: theme.accent, darkAccent: theme.darkAccent, lightAccent: theme.lightAccent })) {
    if (value !== undefined && !isHex(value)) {
      throw new Error(`Invalid n0ct.config.mjs theme.${key}: expected a hex color such as #8B5CF6.`);
    }
  }
  for (const [key, value] of Object.entries({ contentWidth: theme.contentWidth, sidebarWidth: theme.sidebarWidth })) {
    if (value !== undefined && !safeLength(value)) {
      throw new Error(`Invalid n0ct.config.mjs theme.${key}: use a positive CSS length in px, rem, em, vw, vh, or %.`);
    }
  }
  if (theme.glow !== undefined && !['subtle', 'balanced', 'strong'].includes(theme.glow)) {
    throw new Error('Invalid n0ct.config.mjs theme.glow: use subtle, balanced, or strong.');
  }
  const declarations: string[] = [];
  const glow = theme.glow ?? 'balanced';
  const glowStrength = glow === 'subtle' ? '12%' : glow === 'strong' ? '38%' : '24%';
  declarations.push(`--n0ct-glow-strength: ${glowStrength};`);
  if (theme.contentWidth && safeLength(theme.contentWidth)) declarations.push(`--sl-content-width: ${theme.contentWidth};`);
  if (theme.sidebarWidth && safeLength(theme.sidebarWidth)) declarations.push(`--sl-sidebar-width: ${theme.sidebarWidth};`);
  if (theme.accent && isHex(theme.accent)) declarations.push(`--n0ct-accent: ${theme.accent}; --sl-color-accent: ${theme.accent};`);
  const darkAccent = theme.darkAccent ?? theme.accent;
  const lightAccent = theme.lightAccent ?? theme.accent;
  return [
    declarations.length ? `:root { ${declarations.join(' ')} }` : '',
    darkAccent && isHex(darkAccent) ? `:root[data-theme="dark"] { --sl-color-accent: ${darkAccent}; }` : '',
    lightAccent && isHex(lightAccent) ? `:root[data-theme="light"] { --sl-color-accent: ${lightAccent}; }` : '',
  ].filter(Boolean).join('\n');
}

export function createN0ctanePlugin(config: N0ctConfig): StarlightPlugin {
  return {
    name: 'starlight-n0ct',
    hooks: {
      async 'config:setup'({ astroConfig, addIntegration, addRouteMiddleware, updateConfig, config: starlightConfig, logger }) {
        const projectRoot = fileURLToPath(astroConfig.root);
        const runtimeDir = join(projectRoot, '.astro', 'n0ctane');
        await mkdir(runtimeDir, { recursive: true });

        const runtimeSettings = {
          footer: config.footer ?? {},
          sidebar: { topicDisplay: config.sidebar?.topicDisplay ?? 'collapsible' },
        };
        const settingsLiteral = JSON.stringify(runtimeSettings).replace(/</g, '\\u003c');
        const middlewarePath = join(runtimeDir, 'route-middleware.mjs');
        const tokenPath = join(runtimeDir, 'tokens.css');
        const middleware = `const settings = ${settingsLiteral};\nexport function onRequest(context, next) {\n  context.locals.n0ctane = settings;\n  return next();\n}\n`;
        await Promise.all([
          writeFile(middlewarePath, middleware, 'utf8'),
          writeFile(tokenPath, tokenStyles(config), 'utf8'),
        ]);

        addRouteMiddleware({ entrypoint: middlewarePath, order: 'pre' });

        // Remark plugins belong to Astro's Markdown config, not Starlight's
        // narrower `markdown` options. Register through an Astro integration.
        addIntegration(createRemarkCodeFilenamesIntegration());

        const existingCss = [...(starlightConfig.customCss ?? [])];
        const themeCssPath = fileURLToPath(new URL('./styles/theme.css', import.meta.url));
        const themeCssIndex = existingCss.indexOf(themeCssPath);
        // Keep generated tokens after N0ctane's defaults but before user CSS, so
        // project-level customCss can intentionally override theme tokens.
        const insertAt = themeCssIndex >= 0 ? themeCssIndex + 1 : existingCss.length;
        existingCss.splice(insertAt, 0, tokenPath);
        updateConfig({ customCss: existingCss });

        const hasAstroIcon = astroConfig.integrations.some((integration) => integration.name === 'astro-icon');
        if (!hasAstroIcon) {
          addIntegration(icon({
            iconDir: config.icons?.iconDir ?? './src/icons',
            include: { lucide: ['*'], ...(config.icons?.include ?? {}) },
          }));
        }

        logger.info('N0ctane theme components, icon support, and runtime settings are ready.');
      },
    },
  };
}
