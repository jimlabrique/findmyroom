import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const MAX_LINES = 800;
const TARGET_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_SEGMENTS = new Set(["node_modules", ".next", ".git", "dist", "build"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_SEGMENTS.has(entry.name)) continue;
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!TARGET_EXTENSIONS.has(path.extname(entry.name))) continue;
    files.push(fullPath);
  }

  return files;
}

function countLines(content) {
  if (!content.length) return 0;
  return content.split(/\r?\n/).length;
}

async function main() {
  const files = await walk(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const lines = countLines(raw);
    if (lines > MAX_LINES) {
      violations.push({
        file: path.relative(ROOT, file),
        lines,
      });
    }
  }

  if (!violations.length) {
    console.log(`OK: aucun fichier > ${MAX_LINES} lignes.`);
    return;
  }

  console.error(`Échec: ${violations.length} fichier(s) dépassent ${MAX_LINES} lignes:`);
  for (const violation of violations.sort((a, b) => b.lines - a.lines)) {
    console.error(`- ${violation.file}: ${violation.lines} lignes`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
