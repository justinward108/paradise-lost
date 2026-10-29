import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Ensure dist/client and packages/client/dist preserve static portal assets
const clientPublic = path.join(root, "packages", "client", "public");
const rootPublic = path.join(root, "public");
const clientIndex = path.join(root, "packages", "client", "index.html");
for (const outDir of [path.join(root, "packages", "client", "dist"), path.join(root, "dist", "client")]) {
  fs.mkdirSync(outDir, { recursive: true });
  if (fs.existsSync(rootPublic)) fs.cpSync(rootPublic, outDir, { recursive: true });
  if (fs.existsSync(clientPublic)) fs.cpSync(clientPublic, outDir, { recursive: true });
  if (!fs.existsSync(path.join(outDir, "index.html")) && fs.existsSync(clientIndex)) {
    fs.copyFileSync(clientIndex, path.join(outDir, "index.html"));
  }
}

for (const htmlPath of [
  path.join(root, "packages", "client", "index.html"),
  path.join(root, "index.html"),
  path.join(root, "packages", "client", "dist", "index.html"),
  path.join(root, "dist", "client", "index.html")
]) {
  assert(fs.existsSync(htmlPath), `Missing ${htmlPath}`);
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes("G-7BQ8R81F1M"), `Missing GA4 measurement ID in ${htmlPath}`);
  assert(html.includes("data-portal-analytics"), `Missing portal-analytics script in ${htmlPath}`);
  assert(html.includes("https://paradiselost.poor.camp/"), `Missing canonical URL in ${htmlPath}`);
  assert(html.includes("viewport-fit=cover"), `Missing viewport-fit=cover in ${htmlPath}`);
  assert(html.includes("apple-mobile-web-app-capable"), `Missing apple-mobile-web-app-capable in ${htmlPath}`);
  assert(html.includes("manifest.webmanifest"), `Missing manifest link in ${htmlPath}`);
}

for (const baseDir of [
  root,
  path.join(root, "public"),
  path.join(root, "packages", "client", "public"),
  path.join(root, "packages", "client", "dist"),
  path.join(root, "dist", "client")
]) {
  assert(fs.existsSync(path.join(baseDir, "portal-analytics.js")), `Missing portal-analytics.js in ${baseDir}`);
  assert(fs.existsSync(path.join(baseDir, "sitemap.xml")), `Missing sitemap.xml in ${baseDir}`);
  assert(fs.existsSync(path.join(baseDir, "robots.txt")), `Missing robots.txt in ${baseDir}`);
  assert(fs.existsSync(path.join(baseDir, "manifest.webmanifest")), `Missing manifest.webmanifest in ${baseDir}`);
  assert(fs.existsSync(path.join(baseDir, "assets", "portal-preview.png")), `Missing portal-preview.png in ${baseDir}`);
}

assert(fs.existsSync(path.join(root, "AGENTS.md")), "Missing AGENTS.md");
assert(fs.existsSync(path.join(root, "capacitor.config.json")), "Missing capacitor.config.json");
const cap = JSON.parse(fs.readFileSync(path.join(root, "capacitor.config.json"), "utf8"));
assert.equal(cap.appId, "camp.poor.paradiselost");
assert.equal(cap.appName, "Paradise Lost");
assert.equal(cap.webDir, "dist/client");

const css = fs.readFileSync(path.join(root, "packages", "client", "src", "style.css"), "utf8");
assert.match(css, /env\(safe-area-inset-top/);
assert.match(css, /env\(safe-area-inset-bottom/);

console.log("PASS: Paradise Lost static, analytics, SEO, and build output preservation verification.");
