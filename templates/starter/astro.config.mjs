import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { loadEnv } from 'vite';

import n0ctConfig from './n0ct.config.mjs';
import { n0ctane } from '@n0ctanedev/starlight-n0ct';

const fileEnv = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const site = process.env.SITE_URL ?? fileEnv.SITE_URL ?? 'https://example.com';
const base = process.env.BASE_PATH ?? fileEnv.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [
    starlight(n0ctane(n0ctConfig)),
  ],
});
