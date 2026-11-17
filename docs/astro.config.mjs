import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';

import n0ctConfig from '../n0ct.config.mjs';
import { n0ctane } from '@n0ctanedev/starlight-n0ct';

export default defineConfig({
  site: 'https://n0ctanedev.github.io',
  base: '/starlight-n0ct',

  integrations: [
    icon({
      iconDir: n0ctConfig.icons?.iconDir ?? './src/icons',

      include: {
        lucide: ['*'],
        ...(n0ctConfig.icons?.include ?? {}),
      },
    }),

    starlight(n0ctane(n0ctConfig)),
  ],
});