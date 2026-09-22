# Getting Started with J.L. Pinto's Astro Site

## Quick Start

```bash
cd "/Users/moi/Documents/Personal/JL Pinto"
npm run dev
```

Open `http://localhost:3000` in your browser.

## Project Files & Folders

| Location | Purpose |
|----------|---------|
| `src/content.config.ts` | Content collection schemas (4 collections with Zod validation) |
| `src/pages/` | Page routes (home, 404, about) |
| `src/content/` | Markdown content folders (articles, novels, plays, proclamations) |
| `src/styles/global.css` | Global styles with accessibility support |
| `src/components/` | Shared components (ready for Phase 2) |
| `astro.config.mjs` | Astro configuration (static, Spanish locale) |
| `tsconfig.json` | TypeScript strict configuration |
| `public/` | Static assets (images, PDFs) |
| `dist/` | Production build output |

## Available Commands

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Build static site to dist/
npm run preview   # Preview production build locally
npm run astro     # Run Astro CLI commands
npx astro check   # Type check the project
```

## Content Collections

### Adding Articles
Create `src/content/articles/my-article.md`:
```markdown
---
title: Mi Artículo
slug: mi-articulo
summary: Brief description
publishedDate: 2024-09-22
featured: false
---

Article content here...
```

### Adding Novels
Create `src/content/novels/novel-title.md`:
```markdown
---
title: Título de Novela
slug: titulo-novela
summary: Brief description
publishedYear: 2020
purchaseUrl: https://example.com
awards:
  - Award Name
---

Novel content...
```

### Adding Plays
Create `src/content/plays/play-title.md`:
```markdown
---
title: Título de Obra
slug: titulo-obra
summary: Brief description
performanceDate: 2024-10-15
downloadUrl: https://example.com/play.pdf
awards:
  - Award Name
---

Play content...
```

### Adding Proclamations
Create `src/content/proclamations/proclamation-title.md`:
```markdown
---
title: Pregón
slug: pregon-title
summary: Brief description
eventDate: 2024-10-20
downloadUrl: https://example.com/proclamation.pdf
---

Proclamation content...
```

## Field Reference

### Required Fields (All Collections)
- `title` - Content title
- `slug` - URL slug (must be unique per collection)
- `summary` - Brief description

### Optional Fields (All Collections)
- `publishedDate` - Publication date (ISO format)
- `draft` - Set to `true` to exclude from builds
- `legacyUrl` - Original WordPress URL for redirects
- `featured` - Set to `true` to highlight content

### Collection-Specific Optional Fields
- **Novels**: `publishedYear`, `purchaseUrl`, `awards[]`
- **Plays**: `performanceDate`, `awards[]`, `downloadUrl`
- **Proclamations**: `eventDate`, `downloadUrl`

## Build & Deploy

```bash
# Build the site
npm run build

# The dist/ folder is ready for deployment to:
# - Cloudflare Pages
# - Netlify
# - Vercel
# - Any static host
```

## Documentation

- **README.md** - Full project documentation
- **PHASE1_SUMMARY.md** - Phase 1 completion report
- **SCAFFOLD_REPORT.md** - Detailed scaffolding verification
- **GETTING_STARTED.md** - This file

## Next Phase

Phase 2 will include:
1. WordPress content migration (78 articles, 5 novels, 8 plays, 4 proclamations)
2. Editorial Spanish design implementation
3. Detail and archive page components
4. Pagefind search integration

## Troubleshooting

### Type Errors?
```bash
npx astro check
```

### Build Fails?
```bash
npm run build -- --verbose
```

### Clean Build?
```bash
rm -rf .astro dist node_modules
npm install
npm run build
```

## Support Files

- Content collections schema: `src/content.config.ts`
- TypeScript config: `tsconfig.json`
- Astro config: `astro.config.mjs`

---

**Status:** Phase 1 Complete - Ready for Phase 2 Content Migration
