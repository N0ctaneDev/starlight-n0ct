import { defineConfig } from 'tsup';

const bundledStarlightPlugins = [
  'starlight-base-path',
  'starlight-announcement',
  'starlight-blog',
  'starlight-image-zoom',
  'starlight-kbd',
  'starlight-llm-actions',
  'starlight-llms-txt',
  'starlight-scroll-to-top',
  'starlight-sidebar-swipe',
  'starlight-links-validator',
  'starlight-sidebar-topics',
  'starlight-versions',
];

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: false,
  dts: true,

  noExternal: bundledStarlightPlugins,

  external: [
    '@astrojs/starlight',
    '@astrojs/starlight/types',
    'astro',
    'astro-icon',
    'astro-icon/components',
  ],  

  banner: {
    js: [
      'import { createRequire as __n0ctCreateRequire } from "node:module";',
      'const require = __n0ctCreateRequire(import.meta.url);',
    ].join('\n'),
  },
});
