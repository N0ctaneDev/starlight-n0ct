import starlightSidebarTopics from 'starlight-sidebar-topics';
import type { StarlightPlugin } from '@astrojs/starlight/types';
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
  badge?: N0ctBadge;
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
  extra: N0ctNativeSidebarItem[] = [],
): TopicPluginEntry {
  const native = topicToSidebar(topic);
  const items = typeof native === 'object' && native !== null && 'items' in native
    ? [...native.items, ...extra]
    : [...extra];

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

  return {
    label,
    link,
    ...(typeof topic !== 'string' && topic.dropdownIcon ? { icon: topic.dropdownIcon } : {}),
    ...(typeof topic !== 'string' && topic.id ? { id: topic.id } : {}),
    ...(typeof topic !== 'string' && topic.badge ? { badge: topic.badge } : {}),
    ...(typeof topic !== 'string' && topic.attrs ? { attrs: topic.attrs } : {}),
    ...(items.length > 0 ? { items } : {}),
  };
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
  const options = {
    ...(sidebar?.topicOptions ?? {}),
    ...(exclude.length > 0 ? { exclude } : {}),
  };

  const extra = sidebar?.extra ?? [];
  return [starlightSidebarTopics(topics.map((topic) => toTopicPluginEntry(topic, extra)), options)];
}
