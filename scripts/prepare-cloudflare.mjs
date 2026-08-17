import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const viteOutput = resolve(projectRoot, "static-next");
const cloudflareOutput = resolve(projectRoot, "cloudflare-dist");
const cloudflareConfig = resolve(projectRoot, "cloudflare");

await rm(cloudflareOutput, { recursive: true, force: true });
await mkdir(cloudflareOutput, { recursive: true });
await cp(viteOutput, cloudflareOutput, { recursive: true });

async function removeOriginalRasterFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeOriginalRasterFiles(filePath);
    } else if (/\.(png|jpe?g)$/i.test(entry.name) && entry.name !== "og.png") {
      await rm(filePath);
    }
  }
}

await removeOriginalRasterFiles(cloudflareOutput);

const html = await readFile(resolve(projectRoot, "standalone-index.html"), "utf8");
await writeFile(resolve(cloudflareOutput, "index.html"), html, "utf8");

for (const file of ["_headers", "robots.txt"]) {
  await cp(resolve(cloudflareConfig, file), resolve(cloudflareOutput, file));
}

console.log(`Cloudflare Pages output ready: ${cloudflareOutput}`);
