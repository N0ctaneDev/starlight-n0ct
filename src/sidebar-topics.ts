import starlightSidebarTopics from 'starlight-sidebar-topics';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HookParameters, StarlightPlugin } from '@astrojs/starlight/types';
import { topicToSidebar } from './config.js';
import type {
  N0ctBadge,
  N0ctConfig,
  N0ctNativeSidebarItem,
  N0ctSidebarTopic,
} from './types.js';

type TopicPluginEntry = {
  label: string;
  link: string;
  icon?: string;
  id?: string;
  badge?: Exclude<N0ctBadge, string>;
  attrs?: Record<string, string | number | boolean | undefined>;
  items?: N0ctNativeSidebarItem[];
};

const titleCase = (value: string) => value
  .replace(/[-_]+/g, ' ')
  .replace(/\b\w/g, (character) => character.toUpperCase());

function nativeItemLink(item: N0ctNativeSidebarItem): string | undefined {
  if (typeof item === 'string') {
    return `/${item.replace(/^\/+|\/+$/g, '')}/`;
  }

  if ('link' in item) return item.link;
  if ('slug' in item) return `/${item.slug.replace(/^\/+|\/+$/g, '')}/`;
  if ('autogenerate' in item) {
    return `/${item.autogenerate.directory.replace(/^\/+|\/+$/g, '')}/`;
  }

  for (const child of item.items) {
    const link = nativeItemLink(child);
    if (link) return link;
  }

  return undefined;
}

function normalizePluginTopicLink(link: string): string {
  const value = link.trim();
  if (value.startsWith('/') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return value;
  return `/${value}`;
}

function toTopicPluginEntry(
  topic: N0ctSidebarTopic,
  index: number,
  extra: N0ctNativeSidebarItem[] = [],
): TopicPluginEntry {
  const native = topicToSidebar(topic);
  const isGroup = typeof native === 'object' && native !== null && 'items' in native;
  const items = isGroup ? [...native.items, ...extra] : [...extra];

  const label = typeof topic === 'string'
    ? titleCase(topic.split('/').at(-1) ?? topic)
    : topic.label.trim();

  const explicitLink = typeof topic === 'string' || !topic.link
    ? undefined
    : normalizePluginTopicLink(topic.link);

  const directory = typeof topic === 'string'
    ? topic
    : topic.directory
      ?? (typeof topic.autogenerate === 'object' ? topic.autogenerate.directory : undefined);

  const firstItem = items[0];
  const link = explicitLink
    ?? (directory ? `/${directory.replace(/^\/+|\/+$/g, '')}/` : undefined)
    ?? (firstItem ? nativeItemLink(firstItem) : undefined);

  if (!link) {
    throw new Error(
      `N0ctane sidebar topic "${label}" needs a root link, a directory, or at least one manual sidebar item with a destination. Add "link", "directory", or a destination-bearing item.`,
    );
  }

  const id = typeof topic === 'string' ? `n0ct-topic-${index + 1}` : topic.id ?? `n0ct-topic-${index + 1}`;

  return {
    label,
    link,
    ...(typeof topic !== 'string' && topic.icon ? { icon: topic.icon } : {}),
    ...(isGroup ? { id } : (typeof topic !== 'string' && topic.id ? { id: topic.id } : {})),
    ...(typeof topic !== 'string' && topic.badge ? { badge: typeof topic.badge === 'string' ? { text: topic.badge } : topic.badge } : {}),
    ...(typeof topic !== 'string' && topic.attrs ? { attrs: topic.attrs } : {}),
    ...(isGroup ? { items } : {}),
  };
}

function getTopicLandingPageMappings(topics: N0ctSidebarTopic[]): Record<string, string[]> {
  const mappings: Record<string, string[]> = {};

  topics.forEach((topic, index) => {
    const native = topicToSidebar(topic);
    if (!native || typeof native !== 'object' || !('items' in native)) return;

    const directory = typeof topic === 'string'
      ? topic
      : topic.directory
        ?? (typeof topic.autogenerate === 'object' ? topic.autogenerate.directory : undefined);

    const rawLink = typeof topic === 'string'
      ? `/${topic}/`
      : topic.link ?? (directory ? `/${directory}/` : undefined);

    if (!rawLink || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(rawLink)) return;

    // Folder landing pages backed by index.mdx have route IDs such as
    // "guides/index", while the topic link is "/guides/". The upstream
    // resolver compares those values exactly, so associate the index route
    // with its topic ID explicitly.
    const path = rawLink.split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, '');
    if (!path) return;

    const id = typeof topic === 'string' ? `n0ct-topic-${index + 1}` : topic.id ?? `n0ct-topic-${index + 1}`;
    mappings[id] = [`/${path}/index`, `/*/${path}/index`];
  });

  return mappings;
}

export function getBlogRouteExclusions(integrations: N0ctConfig['integrations']): string[] {
  const blog = integrations?.blog;
  if (blog === false) return [];

  const options: Record<string, unknown> = blog && typeof blog === 'object' ? blog : {};
  const rawPrefix = typeof options.prefix === 'string' ? options.prefix : 'blog';
  const prefix = rawPrefix.trim().replace(/^\/+|\/+$/g, '');
  if (!prefix) return [];

  // Blog pages are generated routes with their own sidebar. Let the Blog
  // middleware own them instead of asking Sidebar Topics to find a content entry.
  return [`/${prefix}`, `/${prefix}/**/*`];
}

/**
 * Register the upstream topic-routing plugin for its list and dropdown
 * presentations. Collapsible mode keeps the native N0ctane/Starlight sidebar.
 */
export function createN0ctSidebarTopics(
  sidebar: N0ctConfig['sidebar'],
  integrations: N0ctConfig['integrations'] = {},
): StarlightPlugin[] {
  const mode = sidebar?.topicDisplay ?? 'collapsible';
  if (mode === 'collapsible') return [];

  const topics = sidebar?.topics ?? [];
  if (topics.length === 0) {
    throw new Error(
      `N0ctane sidebar.topicDisplay is "${mode}", but sidebar.topics is empty. Add at least one root-level topic.`,
    );
  }

  const autoExclusions = getBlogRouteExclusions(integrations);
  const configuredExclusions = sidebar?.topicOptions?.exclude ?? [];
  const exclude = [...new Set([...autoExclusions, ...configuredExclusions])];
  const configuredTopicMappings = sidebar?.topicOptions?.topics ?? {};
  const inferredTopicMappings = getTopicLandingPageMappings(topics);
  const topicMappings = { ...configuredTopicMappings };
  for (const [topicId, patterns] of Object.entries(inferredTopicMappings)) {
    topicMappings[topicId] = [...new Set([...(topicMappings[topicId] ?? []), ...patterns])];
  }
  const options = {
    ...(sidebar?.topicOptions ?? {}),
    ...(exclude.length > 0 ? { exclude } : {}),
    ...(Object.keys(topicMappings).length > 0 ? { topics: topicMappings } : {}),
  };

  const extra = sidebar?.extra ?? [];
  const topicPlugin = starlightSidebarTopics(topics.map((topic, index) => toTopicPluginEntry(topic, index, extra)), options);
  const setup = topicPlugin.hooks['config:setup'];

  if (!setup) return [topicPlugin];

  // Starlight Versions wraps the configured sidebar into version groups in its
  // default middleware bucket. Sidebar Topics then needs to resolve the active
  // topic within that selected version, so its route middleware must run last.
  return [{
    ...topicPlugin,
    hooks: {
      ...topicPlugin.hooks,
      'config:setup': async (context: HookParameters<'config:setup'>) => {
        const { addRouteMiddleware, ...hookContext } = context;
        const runtimeDir = join(fileURLToPath(context.astroConfig.root), '.astro', 'n0ctane');
        const debugMiddlewarePath = join(runtimeDir, 'sidebar-topic-debug.mjs');
        await mkdir(dirname(debugMiddlewarePath), { recursive: true });
        await writeFile(debugMiddlewarePath, String.raw`export function onRequest(context) {
  const route = context.locals.starlightRoute;
  const rootId = route.id.endsWith('/index') ? route.id.slice(0, -6) : route.id;
  if (!['components', 'guides', 'showcase', 'reference'].includes(rootId)) return;
  const describe = (entries) => entries.map((entry) => ({
    type: entry.type,
    label: entry.label,
    isCurrent: entry.isCurrent,
    entries: entry.type === 'group' ? describe(entry.entries) : undefined,
  }));
  console.log('[N0CT TOPIC DEBUG]', JSON.stringify({
    id: route.id,
    hasSidebar: route.hasSidebar,
    topic: route.entry?.data?.topic,
    sidebar: describe(route.sidebar ?? []),
  }));
}
`, 'utf8');

        return setup({
          ...hookContext,
          addRouteMiddleware: (middleware) => {
            // Log the version-selected sidebar immediately before Sidebar Topics resolves it.
            addRouteMiddleware({ entrypoint: debugMiddlewarePath, order: 'post' });
            addRouteMiddleware({ ...middleware, order: 'post' });
          },
        });
      },
    },
  }];
}
