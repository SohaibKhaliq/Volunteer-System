const fs = require("fs");
const path = require("path");

const csv = fs.readFileSync(
  path.join(__dirname, "..", "REPORTS", "ROUTE_HELPER_MAP.csv"),
  "utf8"
);
const apiSrc = fs.readFileSync(
  path.join(__dirname, "..", "apps", "app", "src", "lib", "api.ts"),
  "utf8"
);

const lines = csv
  .split("\n")
  .slice(1)
  .filter(Boolean)
  .map((l) => {
    const parts = l.split(",");
    return {
      method: parts[0],
      path: parts[1].replace(/^"|"$/g, ""),
      present: parts[2] === "true",
    };
  });

const missing = [];
for (const r of lines) {
  if (r.present) continue;
  // Build regex to match typical patterns in api.ts: either exact path, template string, or param placeholder
  const pat = r.path.replace(/:\w+/g, "[^/]+");
  const rx = new RegExp(pat.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"));
  const templateRx = new RegExp(pat.replace(/\$\{[^}]+\}/g, "[^/]+"));
  if (
    !rx.test(apiSrc) &&
    !templateRx.test(apiSrc) &&
    !apiSrc.includes(r.path.replace(/:\w+/g, ""))
  ) {
    missing.push(r);
  }
}

console.log("Candidate missing frontend helpers (from CSV false entries):");
for (const m of missing) console.log(`${m.method} ${m.path}`);
