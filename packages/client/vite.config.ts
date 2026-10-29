import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const clientDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(clientDir, '../..');

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
  publicDir: 'public',
  define: { __BUILD__: JSON.stringify(`${buildId()} ${new Date().toISOString().slice(0, 10)}`) },
  plugins: [
    {
      name: 'preserve-portal-assets',
      closeBundle() {
        const outDir = path.resolve(clientDir, 'dist');
        const rootPublic = path.resolve(repoRoot, 'public');
        const clientPublic = path.resolve(clientDir, 'public');
        const rootDistClient = path.resolve(repoRoot, 'dist', 'client');
        for (const pub of [rootPublic, clientPublic]) {
          if (fs.existsSync(pub)) {
            fs.cpSync(pub, outDir, { recursive: true });
          }
        }
        if (fs.existsSync(outDir)) {
          fs.mkdirSync(rootDistClient, { recursive: true });
          fs.cpSync(outDir, rootDistClient, { recursive: true });
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
