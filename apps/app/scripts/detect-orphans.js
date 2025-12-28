import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Configuration ---
const PAGES_DIR = path.resolve(process.cwd(), 'src/pages');
const ROUTES_FILE = path.resolve(process.cwd(), 'src/lib/routes.tsx');

// Files to explicitly ignore (relative to src/pages)
const IGNORED_FILES = [
  // Test files
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  // Layouts or non-page components that might be in pages dir
  /(^|\/)layout\.tsx?$/,
  /(^|\/)components\//,
];

// --- Helpers ---

/**
 * Recursively find all .tsx files in a directory.
 */
function getAllPageFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPageFiles(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

/**
 * Check if a file path is ignored by configuration.
 */
function isIgnored(filePath) {
  const relativePath = path.relative(PAGES_DIR, filePath);
  return IGNORED_FILES.some(pattern => pattern.test(relativePath));
}

// --- Main ---

console.log('🔍 Starting Orphan Page Detection...');
console.log(`📂 Pages Directory: ${PAGES_DIR}`);
console.log(`📄 Routes File:     ${ROUTES_FILE}`);

if (!fs.existsSync(PAGES_DIR)) {
  console.error('❌ Pages directory not found!');
  process.exit(1);
}

if (!fs.existsSync(ROUTES_FILE)) {
  console.error('❌ Routes file not found!');
  process.exit(1);
}

// 1. Get all page files from disk
const allPageFiles = getAllPageFiles(PAGES_DIR).filter(f => !isIgnored(f));
console.log(`\nFound ${allPageFiles.length} page files on disk.`);

// 2. Parse routes file for imports
const routesContent = fs.readFileSync(ROUTES_FILE, 'utf-8');

// Regex to match imports:
// import X from '@/pages/...'
// const X = lazy(() => import('@/pages/...'))
// Match any string literal starting with @/pages/ inside the file
const importRegex = /['"]@\/pages\/([^'"]+)['"]/g;
const matchedImports = new Set();

let match;
while ((match = importRegex.exec(routesContent)) !== null) {
  // match[1] is the part after @/pages/, e.g., "home" or "admin/dashboard"
  matchedImports.add(match[1]);
}

console.log(`Found ${matchedImports.size} unique page references in routes.`);

// 3. Compare and detect orphans
const orphans = [];

allPageFiles.forEach(file => {
  // Get content to check for internal ignore comments if we wanted to get fancy, 
  // but for now relying on file path mapping.
  
  // Convert absolute path to logical import path (approximate)
  // e.g., /.../src/pages/home.tsx -> home
  // e.g., /.../src/pages/admin/users.tsx -> admin/users
  
  const relPath = path.relative(PAGES_DIR, file);
  // Remove extension (.tsx)
  const logicalPath = relPath.replace(/\.tsx$/, '');
  
  // Also handle index files: admin/index -> admin
  const logicalPathIndexStripped = logicalPath.replace(/\/index$/, '');

  // Check if either the direct path or index-stripped path is imported
  const isImported = matchedImports.has(logicalPath) || matchedImports.has(logicalPathIndexStripped);
  
  if (!isImported) {
    orphans.push(relPath);
  }
});

// 4. Report
if (orphans.length > 0) {
  console.error(`\n❌ Found ${orphans.length} ORPHAN pages:\n`);
  orphans.forEach(o => console.error(`  - src/pages/${o}`));
  console.error('\nThese files exist on disk but are not referenced in src/lib/routes.tsx');
  process.exit(1);
} else {
  console.log('\n✅ No orphan pages found! Codebase is clean.');
  process.exit(0);
}
