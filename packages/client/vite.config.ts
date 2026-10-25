import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

// Short commit id shown in playtest notes, so a note can be matched to the build it came from.
function buildId(): string {
  const ref = process.env.COMMIT_REF; // set by Netlify
  if (ref) return ref.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'local';
  }
}

export default defineConfig({
  base: './',
  define: { __BUILD__: JSON.stringify(`${buildId()} ${new Date().toISOString().slice(0, 10)}`) },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
