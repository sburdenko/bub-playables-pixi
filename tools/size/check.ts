import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { HTML_BUDGET_BYTES } from './budget';

const DIST_DIRECTORY = 'dist';
const ENTRY = 'index.html';

/** Fails when the build is not a single HTML file or when that file exceeds the ad-network budget. */
function main(): void {
  if (!existsSync(path.join(DIST_DIRECTORY, ENTRY))) {
    fail(`${DIST_DIRECTORY}/${ENTRY} not found. Run "npm run build" first.`);

    return;
  }

  const files = readdirSync(DIST_DIRECTORY, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile());
  const extraFiles = files.map((entry) => path.relative(DIST_DIRECTORY, path.join(entry.parentPath, entry.name))).filter((file) => file !== ENTRY);
  const size = statSync(path.join(DIST_DIRECTORY, ENTRY)).size;
  const percent = ((size / HTML_BUDGET_BYTES) * 100).toFixed(0);

  console.log(`${ENTRY}: ${megabytes(size)} of ${megabytes(HTML_BUDGET_BYTES)} budget (${percent}%)`);

  if (extraFiles.length > 0) {
    fail(`Playable must be a single HTML file, but the build also emitted: ${extraFiles.join(', ')}`);
  }

  if (size > HTML_BUDGET_BYTES) {
    fail(`${ENTRY} is ${megabytes(size - HTML_BUDGET_BYTES)} over budget. See docs/SPEC.md §7.1.`);
  }
}

function megabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fail(message: string): void {
  console.error(message);
  process.exitCode = 1;
}

main();
