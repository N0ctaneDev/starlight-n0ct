import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import type { RouteMiddlewareHandler, StarlightRouteData } from '@astrojs/starlight/route-data';
import { onRequest as resolveSidebarTopic } from 'starlight-sidebar-topics/middleware';

type SidebarEntry = StarlightRouteData['sidebar'][number];
type SidebarGroup = Extract<SidebarEntry, { type: 'group' }>;

/**
 * Sidebar Topics 0.9.x creates one numeric-labelled top-level group per group
 * topic, then resolves a topic by indexing directly into route.sidebar.
 *
 * Other route middleware can add top-level entries to that same array. Blog,
 * for example, prepends its navigation link on every non-Blog page. Keep those
 * entries out of the positional lookup, then restore them after the topic
 * resolver has selected the active topic sidebar.
 */
function isTopicSidebarGroup(entry: SidebarEntry): entry is SidebarGroup {
  return entry.type === 'group' && /^\d+$/.test(entry.label);
}

export function createSidebarTopicsMiddleware(resolveSidebarTopic: RouteMiddlewareHandler) {
  return defineRouteMiddleware(async (context) => {
    const route = (context.locals as typeof context.locals & { starlightRoute: StarlightRouteData }).starlightRoute;

    // Pages without a sidebar are not resolved by Sidebar Topics. Leave their
    // route data untouched, including any sidebar data supplied by integrations.
    if (!route.hasSidebar) {
      await resolveSidebarTopic(context, async () => {});
      return;
    }

    const originalSidebar = route.sidebar;
    const topicGroups = originalSidebar.filter(isTopicSidebarGroup);
    const additionalEntries = originalSidebar.filter((entry) => !isTopicSidebarGroup(entry));

    // The upstream resolver expects the topic groups to occupy indexes 0..N.
    // Other integrations' links/groups must not shift those indexes.
    route.sidebar = topicGroups;

    await resolveSidebarTopic(context, async () => {});

    // Sidebar Topics replaces route.sidebar with the selected topic's contents.
    // Restore integration-owned entries (e.g. starlight-blog's navigation link).
    route.sidebar.unshift(...additionalEntries);
  });
}

export const onRequest = createSidebarTopicsMiddleware(resolveSidebarTopic);
