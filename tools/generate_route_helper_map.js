const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const routesPath = path.join(repoRoot, "apps", "api", "start", "routes.ts");
const apiPath = path.join(repoRoot, "apps", "app", "src", "lib", "api.ts");

function readFile(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    console.error("Failed to read", p, e.message);
    process.exit(1);
  }
}

const routesSrc = readFile(routesPath);
const apiSrc = readFile(apiPath);

// Simple parser to extract Route.<method>('path'
const routeRegex =
  /Route\.(get|post|put|patch|delete|resource)\s*\(\s*(['"`])([^'"`]+)\2/gm;

// find group prefixes: we look for Route.group(() => { ... }).prefix('/admin') style
// this is a heuristic: find group() blocks and look for .prefix after the block
const groupBlocks = [];
const groupStartRegex = /Route\.group\s*\(\s*\(\)\s*=>\s*\{/gm;
let m;
while ((m = groupStartRegex.exec(routesSrc)) !== null) {
  const start = m.index;
  // find matching closing }
  let depth = 1;
  let i = start + m[0].length;
  while (i < routesSrc.length && depth > 0) {
    const ch = routesSrc[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    i++;
  }
  const block = routesSrc.slice(start, i);
  // find .prefix('...') after the block
  const rest = routesSrc.slice(i, i + 200);
  const prefixMatch = rest.match(/\.prefix\s*\(\s*(['"`])([^'"`]+)\1\s*\)/);
  const prefix = prefixMatch ? prefixMatch[2] : "";
  groupBlocks.push({ start, end: i, prefix, block });
}

// now extract all explicit route definitions
const routes = [];
while ((m = routeRegex.exec(routesSrc)) !== null) {
  const method = m[1];
  const rawPath = m[3];

  // detect if this path sits inside a group block and add prefix
  const group = groupBlocks.find((b) => m.index >= b.start && m.index < b.end);
  const fullPath = (
    group && group.prefix ? `${group.prefix}${rawPath}` : rawPath
  ).replace(/\/\/+/, "/");
  routes.push({ method, rawPath, fullPath });
}

// also include resource routes (we'll expand them roughly to common verbs)
// previously we captured resource() with the resource name string already

// Deduplicate routes
const seen = new Set();
const uniqRoutes = routes.filter((r) => {
  const key = `${r.method.toUpperCase()} ${r.fullPath}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// For each route path, check if api client contains the path literal or a parameterized form
const results = uniqRoutes.map((r) => {
  const exact =
    apiSrc.includes(`'${r.fullPath}'`) ||
    apiSrc.includes(`"${r.fullPath}"`) ||
    apiSrc.includes("`" + r.fullPath + "`");

  // Convert path with :params into a regex that matches either template strings
  // like `/organizations/${orgId}/volunteers` or concatenation forms
  const pattern = r.fullPath
    .replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
    .replace(/\\:([a-zA-Z]+)/g, "(?:\\$\\{[^}]+\\}|[^/]+)");

  // Search for matches in apiSrc
  let regex;
  try {
    regex = new RegExp(pattern);
  } catch (e) {
    regex = null;
  }

  const paramMatch = regex ? regex.test(apiSrc) : false;

  return {
    method: r.method.toUpperCase(),
    path: r.fullPath,
    frontendHelperPresent: exact || paramMatch,
  };
});

// Write CSV
const outLines = ["method,path,frontend_helper_present"];
results.forEach((r) =>
  outLines.push(`${r.method},"${r.path}",${r.frontendHelperPresent}`)
);

const outDir = path.join(repoRoot, "REPORTS");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "ROUTE_HELPER_MAP.csv");
fs.writeFileSync(outFile, outLines.join("\n"), "utf8");
console.log("Wrote", outFile);
