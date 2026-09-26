// Exports the frontend's built-in default content as the JSON file consumed by
// the backend's `npm run seed:home`, so the Figma copy lives in ONE place
// (each section's default.ts) instead of being duplicated in the backend.
//
// Usage (Node >= 23.6, which strips TypeScript types natively):
//   node scripts/export-seed-content.mjs ../backend/seed/content.json
//
// default.ts files must keep type-only imports for this to work without a bundler.
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SECTIONS = {
  _global: {
    header: "global/header",
    footer: "global/footer",
    catalogue: "global/catalogue",
  },
  home: {
    hero: "home/hero",
    about: "home/about",
    quickAccess: "home/quick-access",
    industries: "home/industries",
    productCategories: "home/product-categories",
    impact: "home/impact",
    trust: "home/trust",
    insights: "home/insights",
  },
};

const SEO = {
  home: {
    title: "Cable accessories engineered in India",
    description:
      "A Polycab Group company. Lugs, glands, ferrules and connectors powering India's largest power, industrial and infrastructure projects since 1968.",
    canonical: "",
    noindex: false,
    ogImage: null,
  },
};

const out = process.argv[2];
if (!out) {
  console.error("Usage: node scripts/export-seed-content.mjs <output.json>");
  process.exit(1);
}

const pages = {};
for (const [slug, sections] of Object.entries(SECTIONS)) {
  pages[slug] = { ...(SEO[slug] ? { seo: SEO[slug] } : {}), sections: {} };
  for (const [key, folder] of Object.entries(sections)) {
    const file = resolve("src/components", folder, "default.ts");
    const mod = await import(pathToFileURL(file).href);
    if (!mod.defaults) throw new Error(`${folder}/default.ts has no "defaults" export`);
    pages[slug].sections[key] = mod.defaults;
  }
}

const target = resolve(out);
await mkdir(dirname(target), { recursive: true });
await writeFile(target, JSON.stringify({ pages }, null, 2) + "\n", "utf8");

const count = Object.values(pages).reduce((n, p) => n + Object.keys(p.sections).length, 0);
console.log(`Wrote ${count} sections across ${Object.keys(pages).length} pages to ${target}`);
