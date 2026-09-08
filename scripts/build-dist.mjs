import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [html, css, js, manifest, icon] = await Promise.all([
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, "app.js"), "utf8"),
  readFile(resolve(root, "manifest.webmanifest"), "utf8"),
  readFile(resolve(root, "icon.svg"), "utf8"),
]);

const body = html
  .replace(/<link rel="manifest"[^>]+>/, "")
  .replace(/<link rel="icon"[^>]+>/, "")
  .replace(/<link rel="apple-touch-icon"[^>]+>/, "")
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${css}</style>`)
  .replace('<script src="./app.js"></script>', `<script>${js.replace(/<\/script>/gi, "<\\/script>")}</script>`);

const worker = `export default {\n  async fetch(request) {\n    const url = new URL(request.url);\n    if (url.pathname.endsWith("/manifest.webmanifest")) return new Response(${JSON.stringify(manifest)}, { headers: { "content-type": "application/manifest+json" } });\n    if (url.pathname.endsWith("/icon.svg")) return new Response(${JSON.stringify(icon)}, { headers: { "content-type": "image/svg+xml" } });\n    return new Response(${JSON.stringify(body)}, { headers: { "content-type": "text/html; charset=utf-8" } });\n  }\n};\n`;

await mkdir(resolve(root, "dist"), { recursive: true });
const standalone = worker.replace('    const url = new URL(request.url);', `    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return Response.json({ error: { code: 'BACKEND_UNAVAILABLE', message: 'Run the Clippy Express server for API functionality.' } }, { status: 503 });
    if (url.pathname.endsWith('/sw.js')) return new Response('', { status: 404 });`);
await writeFile(resolve(root, "dist/index.js"), standalone);
console.log("Built dist/index.js");
