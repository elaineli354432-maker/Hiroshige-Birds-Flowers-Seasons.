import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';

// The exhibition exports static HTML and assets without Worker bindings.
export default defineConfig({
  // Keep the same build usable at the Sites root and at GitHub Pages' project path.
  base: process.env.GITHUB_ACTIONS ? './' : '/',
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext(), sites()],
});
