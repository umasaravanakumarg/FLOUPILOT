import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const chunksDirectory = join(process.cwd(), ".next", "static", "chunks");
const fixtureMarkers = ["Studio Noir", "EXP-301", "Project Alpha"];
const violations = [];

async function scan(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
    } else if (entry.isFile() && /\.(?:js|mjs)$/.test(entry.name)) {
      const contents = await readFile(path, "utf8");
      for (const marker of fixtureMarkers) {
        if (contents.includes(marker)) violations.push({ path, marker });
      }
    }
  }
}

await scan(chunksDirectory);
if (violations.length) {
  for (const violation of violations) {
    console.error(`Demo fixture "${violation.marker}" is present in client bundle ${violation.path}`);
  }
  process.exitCode = 1;
} else {
  console.log("No seeded demo records found in browser JavaScript bundles.");
}
