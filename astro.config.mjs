// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({

  site: 'https://santiagojojoa.com',
  // Solo /api/analyze corre en servidor (prerender = false); el resto se genera estático.
  adapter: vercel(),
  redirects: {
    '/': '/es',
  },
  vite: {
    plugins: [tailwindcss()],
    // Scripts siempre como archivo externo: así la CSP solo necesita el hash del script inline de Base.astro.
    build: { assetsInlineLimit: 0 },
  },

  integrations: [react()],



  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
});
