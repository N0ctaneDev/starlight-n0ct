import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { N0ctConfig } from './types.js';
import { generateN0ctThemeSetCss, resolveN0ctThemeConfig, validateN0ctThemeColors } from './theme-colors.js';
import { createRemarkCodeFilenamesIntegration } from './remark-code-filenames.js';

const safeLength = (value: string) => {
  const match = /^(\d+(?:\.\d+)?)(px|rem|em|vw|vh|%)$/.exec(value);
  return Boolean(match && Number(match[1]) > 0);
};

function tokenStyles(config: N0ctConfig) {
  const theme = config.theme ?? {};
  for (const [key, value] of Object.entries({
    contentWidth: theme.contentWidth,
    sidebarWidth: theme.sidebarWidth,
  })) {
    if (value !== undefined && !safeLength(value)) {
      throw new Error('Invalid n0ct.config.mjs theme.' + key + ': use a positive CSS length in px, rem, em, vh, vw, or %.');
    }
  }
  if (theme.glow !== undefined && !['subtle', 'balanced', 'strong'].includes(theme.glow)) {
    throw new Error('Invalid n0ct.config.mjs theme.glow: use subtle, balanced, or strong.');
  }

  const glow = theme.glow ?? 'balanced';
  const glowStrength = glow === 'subtle' ? '12%' : glow === 'strong' ? '34%' : '22%';
  const backgroundGlow = glow === 'subtle' ? '4%' : glow === 'strong' ? '11%' : '7%';
  const accentGlow = glow === 'subtle' ? '2%' : glow === 'strong' ? '7%' : '5%';
  const layout = [
    '--n0ct-glow-strength: ' + glowStrength + ';',
    '--n0ct-glow-background-strength: ' + backgroundGlow + ';',
    '--n0ct-glow-accent-strength: ' + accentGlow + ';',
    ...(theme.contentWidth ? ['--sl-content-width: ' + theme.contentWidth + ';'] : []),
    ...(theme.sidebarWidth ? ['--sl-sidebar-width: ' + theme.sidebarWidth + ';'] : []),
  ];
  return generateN0ctThemeSetCss(theme) + '\n:root { ' + layout.join(' ') + ' }\n';
}


function themeBootstrapScript(
  theme: { defaultTheme: string; themes: Array<{ id: string; favicon?: string }> },
  fallbackFavicon: string,
  baseUrl: string,
): string {
  const settingsLiteral = JSON.stringify({
    defaultTheme: theme.defaultTheme,
    themes: theme.themes.map(({ id }) => id),
    favicon: fallbackFavicon,
    favicons: theme.themes.reduce<Record<string, string>>((result, { id, favicon }) => {
      if (favicon) result[id] = favicon;
      return result;
    }, {}),
    baseUrl: (baseUrl || '/').replace(/\/?$/, '/'),
  }).replace(/</g, '\\u003c');

  return `(() => {
    const settings = ${settingsLiteral};
    const normalize = (preferences) => ({
      theme: settings.themes.includes(preferences?.theme)
        ? preferences.theme
        : settings.defaultTheme,
      mode: preferences?.mode === 'light' ? 'light' : 'dark',
    });

    const readPreferences = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('n0ct-theme-preferences') || 'null');
        const legacyMode = localStorage.getItem('starlight-theme');
        return normalize({
          theme: saved?.theme,
          mode: saved?.mode === 'light' || (!saved && legacyMode === 'light') ? 'light' : 'dark',
        });
      } catch {
        return normalize(null);
      }
    };

    const apply = (targetDocument, preferences) => {
      if (!targetDocument?.documentElement) return;

      const next = normalize(preferences);
      const root = targetDocument.documentElement;
      root.dataset.theme = next.mode;
      root.dataset.n0ctTheme = next.theme;
      root.dataset.n0ctCodeTheme = next.theme + '-' + next.mode;

      const path = settings.favicons[next.theme] || settings.favicon || '/favicon.svg';
      const href = /^(?:https?:|data:)/i.test(path)
        ? path
        : settings.baseUrl + path.replace(/^\/+/, '');
      let links = Array.from(targetDocument.querySelectorAll('link[rel~="icon"]'));
      if (links.length === 0 && targetDocument.head) {
        const link = targetDocument.createElement('link');
        link.rel = 'icon';
        targetDocument.head.append(link);
        links = [link];
      }
      links.forEach((link) => link.setAttribute('href', href));
      targetDocument.querySelectorAll('[data-n0ct-themed-favicon]').forEach((image) => {
        image.setAttribute('src', href);
      });
    };

    apply(document, readPreferences());

    if (!window.__n0ctThemeBootstrapInstalled) {
      window.__n0ctThemeBootstrapInstalled = true;
      document.addEventListener('astro:before-swap', (event) => {
        const current = document.documentElement;
        apply(event.newDocument, {
          mode: current.dataset.theme,
          theme: current.dataset.n0ctTheme,
        });
      });
    }
  })();`;
}

export function createN0ctanePlugin(config: N0ctConfig): StarlightPlugin {
  return {
    name: 'starlight-n0ct',
    hooks: {
      async 'config:setup'({ astroConfig, addIntegration, addRouteMiddleware, updateConfig, config: starlightConfig, logger }) {
        const projectRoot = fileURLToPath(astroConfig.root);
        const runtimeDir = join(projectRoot, '.astro', 'n0ctane');
        await mkdir(runtimeDir, { recursive: true });

        const themeSet = resolveN0ctThemeConfig(config.theme);
        const runtimeSettings = {
          favicon: config.favicon ?? '/favicon.svg',
          footer: config.footer ?? {},
          sidebar: { topicDisplay: config.sidebar?.topicDisplay ?? 'collapsible' },
          versioning: config.versioning ?? false,
          theme: {
            defaultTheme: themeSet.defaultTheme,
            themes: Object.entries(themeSet.themes).map(([id, theme]) => ({
              id,
              label: theme.label,
              favicon: theme.favicon,
              logo: theme.logo,
              colors: theme.colors,
            })),
          },
        };
        const settingsLiteral = JSON.stringify(runtimeSettings).replace(/</g, '\\u003c');
        const bootstrapScript = themeBootstrapScript(
          runtimeSettings.theme,
          runtimeSettings.favicon,
          astroConfig.base,
        );
        const existingHead = [...(starlightConfig.head ?? [])];
        existingHead.unshift({
          tag: 'script',
          attrs: { 'data-n0ct-theme-bootstrap': 'true' },
          content: bootstrapScript,
        });
        updateConfig({ head: existingHead });

        const middlewarePath = join(runtimeDir, 'route-middleware.mjs');
        const tokenPath = join(runtimeDir, 'tokens.css');
        const middleware = `const settings = ${settingsLiteral};\nexport function onRequest(context, next) {\n  context.locals.n0ctane = settings;\n  return next();\n}\n`;
        await Promise.all([
          writeFile(middlewarePath, middleware, 'utf8'),
          writeFile(tokenPath, tokenStyles(config), 'utf8'),
        ]);

        addRouteMiddleware({ entrypoint: middlewarePath, order: 'pre' });

        // Register filename normalization on the configured processor: native
        // Sätteri mdast hooks by default, or Remark for an explicit Unified setup.
        addIntegration(createRemarkCodeFilenamesIntegration());
        // Tailwind v4 is installed as an Astro integration so consumers do not
        // have to repeat the Vite plugin setup in their own astro.config.mjs.
        addIntegration({
          name: 'starlight-n0ct-tailwind',
          hooks: {
            'astro:config:setup': ({ updateConfig }) => {
              updateConfig({ vite: { plugins: [tailwindcss()] } });
            },
          },
        });

        const existingCss = [...(starlightConfig.customCss ?? [])];
        const themeCssPath = fileURLToPath(new URL('./styles/theme.css', import.meta.url));
        const themeCssIndex = existingCss.indexOf(themeCssPath);
        // Keep generated tokens after the base theme stylesheet but before user CSS, so
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

        for (const [themeId, theme] of Object.entries(themeSet.themes)) {
          for (const warning of validateN0ctThemeColors(theme.colors)) {
            logger.warn('Theme "' + themeId + '": ' + warning);
          }
        }
        logger.info('N0ctane named palettes, snapshot components, and runtime settings are ready.');
      },
    },
  };
}
