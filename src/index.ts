import type { StarlightUserConfig } from '@astrojs/starlight/types';
import codeblocks from 'starlight-codeblocks';
import { fileURLToPath } from 'node:url';
import { createN0ctIntegrations, createN0ctVersioning } from './integrations.js';
import { normalizeN0ctConfig } from './config.js';
import { createN0ctanePlugin } from './plugin.js';
import { createN0ctSidebarTopics } from './sidebar-topics.js';
import { createN0ctaneCodeThemes } from './code-themes.js';
import { resolveN0ctThemeColors } from './theme-colors.js';
import type { N0ctConfig, N0ctaneOptions } from './types.js';

export type {
  N0ctBadge,
  N0ctConfig,
  N0ctExpandedSidebarGroup,
  N0ctNativeSidebarItem,
  N0ctNormalizedConfig,
  N0ctNormalizedSidebarItem,
  N0ctaneOptions,
  N0ctSidebarTopic,
  N0ctSidebarTopicsPluginOptions,
  N0ctVersioningConfig,
  N0ctPluginOptions,
} from './types.js';
export { normalizeN0ctConfig, topicToSidebar } from './config.js';
export { createN0ctIntegrations, createN0ctVersioning } from './integrations.js';
export { createN0ctSidebarTopics } from './sidebar-topics.js';
export { resolveN0ctThemeColors, generateN0ctThemeCss, validateN0ctThemeColors } from './theme-colors.js';
export type { N0ctThemeColors, N0ctThemeMode, N0ctThemePalette, N0ctThemeOverrides, N0ctThemeSemanticColors, N0ctThemeConfig } from './types.js';

/**
 * Expand the intentionally small `n0ct.config.mjs` API into a complete
 * Starlight configuration object.
 *
 * Usage: `starlight(n0ctane(n0ctConfig))`.
 */
export function n0ctane(config: N0ctaneOptions): StarlightUserConfig {
  const normalized = normalizeN0ctConfig(config);
  const {
    sidebarTopicDisplay,
    sidebar: normalizedSidebar,
    ...starlightDefaults
  } = normalized;
  const advanced = config.starlight ?? {};
  const {
    sidebar: advancedSidebar,
    plugins: advancedPlugins,
    ...advancedStarlight
  } = advanced;
  const usesSidebarTopicsPlugin = sidebarTopicDisplay !== 'collapsible';
  if (usesSidebarTopicsPlugin && advancedSidebar !== undefined) {
    throw new Error(
      `N0ctane sidebar.topicDisplay is "${sidebarTopicDisplay}", which delegates sidebar routing to starlight-sidebar-topics. Remove starlight.sidebar or switch topicDisplay to "collapsible".`,
    );
  }
  if (usesSidebarTopicsPlugin && advancedStarlight.components?.Sidebar !== undefined) {
    throw new Error(
      `N0ctane sidebar.topicDisplay is "${sidebarTopicDisplay}", but starlight.components.Sidebar replaces the topic selector. Remove that override or switch topicDisplay to "collapsible".`,
    );
  }

  const blogConfig = config.integrations?.blog;
  const blogEnabled = blogConfig !== false;
  const blogOptions: Record<string, unknown> = blogConfig && typeof blogConfig === 'object' ? blogConfig : {};
  const blogNavigation = blogOptions.navigation ?? 'header-end';
  const hasBlogHeaderStart = blogEnabled && blogNavigation === 'header-start';
  const hasBlogHeaderEnd = blogEnabled && blogNavigation === 'header-end';

  const defaultCss = fileURLToPath(new URL('./styles/theme.css', import.meta.url));
  const interfaceCss = fileURLToPath(new URL('./styles/interface.css', import.meta.url));
  const componentsCss = fileURLToPath(new URL('./styles/components.css', import.meta.url));
  const component = (name: string) => fileURLToPath(new URL(`./components/${name}.astro`, import.meta.url));
  const themeComponents = {
    // Blog and Versions both override ThemeSelect. The composed N0ctane
    // variants render their public components alongside the N0ctane toggle.
    ThemeSelect: component(
      hasBlogHeaderEnd
        ? (config.versioning ? 'BlogVersionedThemeSelect' : 'BlogThemeSelect')
        : (config.versioning ? 'VersionedThemeSelect' : 'ThemeSelect'),
    ),
    // Blog's header-start navigation overrides SiteTitle; compose it with
    // N0ctane's title rather than dropping the upstream Blog link.
    SiteTitle: component(hasBlogHeaderStart ? 'BlogSiteTitle' : 'SiteTitle'),
    Footer: component('Footer'),
    Sidebar: component('Sidebar'),
  };

  const resolvedTheme = resolveN0ctThemeColors(config.theme?.colors);
  const expressiveCode = (advanced.expressiveCode === false ? false : {
    themes: createN0ctaneCodeThemes(resolvedTheme),
    useStarlightDarkModeSwitch: true,
    styleOverrides: {
      borderRadius: '0.65rem',
      frames: { shadowColor: 'transparent' },
    },
    ...(typeof advanced.expressiveCode === 'object' && advanced.expressiveCode !== null
      ? advanced.expressiveCode
      : {}),
  }) as StarlightUserConfig['expressiveCode'];

  return {
    ...starlightDefaults,
    ...advancedStarlight,
    title: config.title,
    ...(config.description ? { description: config.description } : {}),
    ...(!usesSidebarTopicsPlugin
      ? { sidebar: advancedSidebar ?? (normalizedSidebar as StarlightUserConfig['sidebar']) }
      : {}),
    customCss: [defaultCss, interfaceCss, componentsCss, ...(advanced.customCss ?? [])],
    components: { ...themeComponents, ...(advanced.components ?? {}) },
    expressiveCode,
    plugins: [
      // Sidebar Topics must run before Blog's route middleware: ordinary docs
      // get a topic sidebar first, Blog then adds its mobile link; generated Blog
      // routes are auto-excluded so Blog can install its own sidebar.
      ...createN0ctSidebarTopics(config.sidebar, config.integrations),
      ...createN0ctIntegrations(config.integrations),
      createN0ctanePlugin(config),
      ...(advancedPlugins ?? []),
      ...(advanced.expressiveCode === false ? [] : [codeblocks({
        notation: {},
        lineStates: {},
        wordDiff: {},
        shellCopy: {},
        codeTabs: { control: 'tabs' },
      })]),
      // Run last so versioned sidebars wrap the final configured sidebar and
      // upstream component overrides are applied after the other built-ins.
      ...createN0ctVersioning(config.versioning),
    ],
  };
}

/** Identity helper for JS and TS config files with editor type inference. */
export function defineN0ctConfig<T extends N0ctConfig>(config: T): T {
  return config;
}
