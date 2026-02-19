import tailwindcss from "@tailwindcss/vite";
// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://lukaschod.github.io',
    base: `project-dawn-website`,
  integrations: [mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    remarkPlugins: [
      [remarkMath, { singleDollarTextMath: true }]
    ],
    rehypePlugins: [rehypeMathjax],
  },
});