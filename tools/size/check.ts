import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { HTML_BUDGET_BYTES } from './budget';

const DIST_DIRECTORY = 'dist';
const ENTRY = 'index.html';

/** Every build under dist/ (the plain one and one per ad network) must be a single HTML file within the budget. */
function main(): void {
  const builds = findBuilds(DIST_DIRECTORY);
  if (builds.length === 0) {
    fail(`No ${ENTRY} under ${DIST_DIRECTORY}/. Run "npm run build" first.`);

    return;
  }

  builds.forEach(checkBuild);
}

function findBuilds(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const entries = readdirSync(directory, { withFileTypes: true });
  const nested = entries.filter((entry) => entry.isDirectory()).flatMap((entry) => findBuilds(path.join(directory, entry.name)));

  return entries.some((entry) => entry.isFile() && entry.name === ENTRY) ? [directory, ...nested] : nested;
}

function checkBuild(directory: string): void {
  const size = statSync(path.join(directory, ENTRY)).size;
  const extraFiles = readdirSync(directory, { withFileTypes: true }).filter((entry) => entry.isFile() && entry.name !== ENTRY);
  const percent = ((size / HTML_BUDGET_BYTES) * 100).toFixed(0);
  console.log(`${path.join(directory, ENTRY)}: ${megabytes(size)} of ${megabytes(HTML_BUDGET_BYTES)} budget (${percent}%)`);

  if (extraFiles.length > 0) {
    fail(`${directory} must hold a single HTML file, but also has: ${extraFiles.map((entry) => entry.name).join(', ')}`);
  }

  if (size > HTML_BUDGET_BYTES) {
    fail(`${path.join(directory, ENTRY)} is ${megabytes(size - HTML_BUDGET_BYTES)} over budget.`);
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
