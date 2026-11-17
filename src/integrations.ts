import announcement from 'starlight-announcement';
import blog from 'starlight-blog';
import imageZoom from 'starlight-image-zoom';
import kbd from 'starlight-kbd';
import llmActions from 'starlight-llm-actions';
import llmsTxt from 'starlight-llms-txt';
import linksValidator from 'starlight-links-validator';
import scrollToTop from 'starlight-scroll-to-top';
import sidebarSwipe from 'starlight-sidebar-swipe';
import { starlightBasePath } from 'starlight-base-path';
import starlightVersions from 'starlight-versions';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { N0ctConfig, N0ctPluginOptions } from './types.js';

// These packages export Starlight plugin factories. They are registered in the
// Starlight `plugins` list, not the Astro `integrations` list.
type PluginFactory = (options?: Record<string, unknown>) => StarlightPlugin;

const factories: Record<keyof NonNullable<N0ctConfig['integrations']>, PluginFactory> = {
  basePath: starlightBasePath as PluginFactory,
  announcement: announcement as PluginFactory,
  kbd: kbd as PluginFactory,
  llmsTxt: llmsTxt as PluginFactory,
  scrollToTop: scrollToTop as PluginFactory,
  llmActions: llmActions as PluginFactory,
  sidebarSwipe: sidebarSwipe as PluginFactory,
  linksValidator: linksValidator as PluginFactory,
  blog: blog as PluginFactory,
  imageZoom: imageZoom as PluginFactory,
};

const defaultKeyboardTypes = [
  { id: 'mac', label: 'macOS', detector: 'apple' },
  { id: 'windows', label: 'Windows', detector: 'windows' },
  { id: 'linux', label: 'Linux', detector: 'linux', default: true },
];

/** Build each bundled Starlight integration from the short N0ct config. */
export function createN0ctIntegrations(config: N0ctConfig['integrations'] = {}): StarlightPlugin[] {
  const dedicatedLlmsTxtEnabled = config.llmsTxt !== false;
  const llmActionsOptions = config.llmActions;
  if (dedicatedLlmsTxtEnabled && llmActionsOptions && llmActionsOptions.llmsTxt === true) {
    throw new Error(
      'N0ctane: both integrations.llmsTxt and integrations.llmActions.llmsTxt are enabled. Keep the dedicated llmsTxt integration (default), or set integrations.llmsTxt = false to let llmActions generate llms.txt.',
    );
  }

  return (Object.entries(factories) as Array<[keyof typeof factories, PluginFactory]>)
    .flatMap(([name, factory]) => {
      const configured = config[name] as N0ctPluginOptions | undefined;
      if (configured === false) return [];
      const options = { ...(configured ?? {}) };

      // starlight-kbd requires at least one keyboard type and exactly one
      // default. Supply cross-platform presets when the user has not provided
      // their own set; explicit `types` always take precedence.
      if (name === 'kbd' && options.types === undefined) {
        options.types = defaultKeyboardTypes.map((type) => ({ ...type }));
      }

      // Prefer the dedicated llmsTxt integration when enabled. If it is disabled,
      // allow llmActions to own that feature unless the user explicitly opts out.
      if (name === 'llmActions' && options.llmsTxt === undefined) {
        options.llmsTxt = !dedicatedLlmsTxtEnabled;
      }
      return [factory(options)];
    });
}

/** Register the upstream Starlight Versions plugin when its config is enabled.
 * The plugin owns archiving, routing, version-aware sidebars and the selector UI.
 */
export function createN0ctVersioning(config: N0ctConfig['versioning']): StarlightPlugin[] {
  if (!config) return [];
  return [starlightVersions(config)];
}
