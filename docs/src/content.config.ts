
import { defineCollection } from 'astro:content';

import {
  docsLoader,
  i18nLoader,
} from '@astrojs/starlight/loaders';

import {
  docsSchema,
  i18nSchema,
} from '@astrojs/starlight/schema';

import { blogSchema } from 'starlight-blog/schema';
import { topicSchema } from 'starlight-sidebar-topics/schema';
import { docsVersionsLoader } from 'starlight-versions/loader';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),

    schema: docsSchema({
      // Merge the Starlight Blog frontmatter fields
      // into Starlight's existing docs schema.
      extend: (context) => blogSchema(context).merge(topicSchema),
    }),
  }),

  i18n: defineCollection({
    loader: i18nLoader(),
    schema: i18nSchema(),
  }),

  // Required by starlight-versions whenever versioning is enabled. The loader
  // is harmless when versioning is disabled and the collection is empty.
  versions: defineCollection({
    loader: docsVersionsLoader(),
  }),
};
