import { readdir, stat } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("C:/Users/test1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const root = new URL("../public/", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1");

async function walk(directory) {
  const entries = await readdir(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const originals = (await walk(root)).filter((file) => /\.(png|jpe?g)$/i.test(file) && !file.endsWith("og.png"));
let sourceBytes = 0;
let outputBytes = 0;

for (const input of originals) {
  const info = await stat(input);
  sourceBytes += info.size;
  const parsed = parse(input);
  const output = join(parsed.dir, `${parsed.name}.webp`);
  await sharp(input)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5, smartSubsample: true })
    .toFile(output);
  outputBytes += (await stat(output)).size;
}

console.log(JSON.stringify({
  converted: originals.length,
  sourceMB: Number((sourceBytes / 1024 / 1024).toFixed(2)),
  webpMB: Number((outputBytes / 1024 / 1024).toFixed(2)),
}, null, 2));
