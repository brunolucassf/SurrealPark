import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { isCaminhoIndexavel } from './src/data/indexacao.ts';

const site = process.env.PUBLIC_SITE_URL ?? 'https://surreal.art.br';

export default defineConfig({
  site,
  output: 'static',
  scopedStyleStrategy: 'class',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (pagina) => isCaminhoIndexavel(new URL(pagina).pathname) })],
  devToolbar: { enabled: false },
  vite: {
    build: { chunkSizeWarningLimit: 700 },
    optimizeDeps: { include: ['gsap', 'gsap/ScrollTrigger', 'gsap/SplitText', 'gsap/CustomEase', 'gsap/MorphSVGPlugin', 'lenis', 'three', 'three/addons/loaders/GLTFLoader.js', 'three/addons/libs/meshopt_decoder.module.js'] },
  },
  i18n: {
    locales: ['pt-BR'],
    defaultLocale: 'pt-BR',
    routing: { prefixDefaultLocale: false },
  },
});
