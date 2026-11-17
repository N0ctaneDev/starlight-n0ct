declare module 'starlight-sidebar-topics' {
  import type { StarlightPlugin } from '@astrojs/starlight/types';

  export interface SidebarTopicsOptions {
    exclude?: string[];
    topics?: Record<string, string[]>;
  }

  const starlightSidebarTopics: (
    topics: Array<Record<string, unknown>>,
    options?: SidebarTopicsOptions,
  ) => StarlightPlugin;

  export default starlightSidebarTopics;
}


declare module 'starlight-sidebar-topics/schema' {
  /** Frontmatter schema for associating otherwise unlisted docs with a topic. */
  export const topicSchema: any;
}
